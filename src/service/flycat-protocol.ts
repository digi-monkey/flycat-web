import { Event, RawEvent } from './api';
import { generateRandomBytes } from './crypto';

export type Version = string;

export enum DataType {
  Storage = '01', //	storage	keep stored in Nostr, might be update later
  Memory = '02', // memory	can be deleted after some time
}

export enum FlagType {
  SiteMetaData = '01', //	site metadata, contains site content-ids
  ArticlePage = '02', // article page, a list of articles
  PhotoPage = '03', // photo page, a list of photo url
}

export type FlycatHeader = ['flycat', Version, DataType, FlagType];

export enum FlycatWellKnownEventKind {
  SiteMetaData = 10000,
}

// Schema
export interface SiteMetaDataContentSchema {
  site_name: string; // site-name	name of the site	string	32
  site_description: string; // site-description	description of the site	string	420
  page_ids: number[]; // page-ids a list of page-id number	[u16;256]	256 max
  extra_data: string; // extra data	-
}

export interface ArticlePageContentSchema {
  page_id: number; // (plus 10000 will be the event kind)
  count: number; // count	how many article in this page	u8	1
  article_ids: number[]; // article-ids	a list of unique article id	[u32;count]	1024 max
  data: ArticleDataSchema[]; // data	a list of article data	[;256]	256 max
}

export interface ArticleDataSchema {
  id: number; // unique article_id
  title: string; // title	article title	string	24
  content_size: number; // content-size	article content size	u32	4
  content: string; // content	article content	[u8;content-size]	-
  created_at: number; // created-at	created unix timestamp number	u64	8
  updated_at: number; // updated-at	update unix timestamp number	u64	8
}

export type Schema =
  | SiteMetaDataContentSchema
  | ArticlePageContentSchema
  | ArticleDataSchema;

export function isSiteMetaDataContentSchema(
  data: any,
): data is SiteMetaDataContentSchema {
  return (
    'site_name' in data &&
    'site_description' in data &&
    'page_ids' in data &&
    'extra_data' in data
  );
}

export function isArticlePageContentSchema(
  data: any,
): data is ArticlePageContentSchema {
  return (
    'page_id' in data &&
    'count' in data &&
    'article_ids' in data &&
    'data' in data
  );
}

export function isArticleDataSchema(data: any): data is ArticleDataSchema {
  return (
    'id' in data &&
    'title' in data &&
    'content_size' in data &&
    'content' in data &&
    'created_at' in data &&
    'updated_at' in data
  );
}

export class Flycat {
  publicKey: string;
  privateKey: string;
  version: string;

  constructor({
    publicKey,
    privateKey,
    version = '',
  }: {
    publicKey: string;
    privateKey: string;
    version: string;
  }) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.version = version;
  }

  newHeader({
    dataType,
    flagType,
  }: {
    dataType: DataType;
    flagType: FlagType;
  }): FlycatHeader {
    return ['flycat', this.version, dataType, flagType];
  }

  static isPageFull(
    pageId: number,
    articles: (ArticleDataSchema & { page_id: number })[],
    limitSize = 100000,
  ): boolean {
    const targetArticles: (ArticleDataSchema & { page_id: number })[] = [];
    for (const ar of articles) {
      if (ar.page_id === pageId) {
        targetArticles.push(ar);
      }
    }
    const size = targetArticles.reduce(
      (prev, cur) => prev + cur.content_size,
      0,
    );
    return size > limitSize;
  }

  static serialize(data: Schema): string {
    return JSON.stringify(data);
  }

  static deserialize(data: string) {
    const deserialized = JSON.parse(data);
    switch (true) {
      case isSiteMetaDataContentSchema(deserialized):
        return deserialized as SiteMetaDataContentSchema;

      case isArticlePageContentSchema(deserialized):
        return deserialized as ArticlePageContentSchema;

      case isArticleDataSchema(deserialized):
        return deserialized as ArticleDataSchema;

      default:
        throw new Error('unknown type schema');
    }
  }

  async newSite({
    name,
    description,
  }: {
    name: string;
    description: string;
  }): Promise<Event> {
    const metaData: SiteMetaDataContentSchema = {
      site_name: name,
      site_description: description,
      page_ids: [],
      extra_data: '',
    };
    const content = Flycat.serialize(metaData);

    const dataType = DataType.Storage;
    const flagType = FlagType.SiteMetaData;
    const header = this.newHeader({ dataType, flagType });

    const e = new RawEvent(
      this.publicKey,
      FlycatWellKnownEventKind.SiteMetaData,
      [header as any],
      content,
    );
    return await e.toEvent(this.privateKey);
  }

  async updateSite(metaData: SiteMetaDataContentSchema): Promise<Event> {
    const content = Flycat.serialize(metaData);
    const dataType = DataType.Storage;
    const flagType = FlagType.SiteMetaData;
    const header = this.newHeader({ dataType, flagType });

    const e = new RawEvent(
      this.publicKey,
      FlycatWellKnownEventKind.SiteMetaData,
      [header as any],
      content,
    );
    return await e.toEvent(this.privateKey);
  }

  async updateArticlePage(ap: ArticlePageContentSchema) {
    const kind = FlycatWellKnownEventKind.SiteMetaData + ap.page_id;
    if (!validateArticlePageKind(kind)) {
      throw new Error('invalid kind');
    }

    const content = Flycat.serialize(ap);
    const dataType = DataType.Storage;
    const flagType = FlagType.ArticlePage;
    const header = this.newHeader({ dataType, flagType });

    const e = new RawEvent(this.publicKey, kind, [header as any], content);
    return await e.toEvent(this.privateKey);
  }

  newArticlePageContent(
    pageId: number,
    articles: ArticleDataSchema[],
  ): ArticlePageContentSchema {
    return {
      page_id: pageId,
      count: articles.length,
      article_ids: articles.map(a => a.id),
      data: articles,
    };
  }

  newArticleData({
    title,
    content,
  }: {
    title: string;
    content: string;
  }): ArticleDataSchema {
    const content_size = content.length;
    const timestamp = Math.round(Date.now() / 1000); // in seconds
    return {
      id: randomArticleId(),
      title,
      content_size,
      content,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }
}

export function randomArticleId() {
  return +generateRandomBytes(2);
}

export function validateArticlePageKind(kind: number) {
  return (
    kind > FlycatWellKnownEventKind.SiteMetaData &&
    kind <= FlycatWellKnownEventKind.SiteMetaData + 256
  );
}
