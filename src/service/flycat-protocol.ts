import { PublicKey, RawEvent } from './api';
import { generateRandomBytes } from './crypto';

export type Version = string;
export type ShareContentId = string; // <flag(first byte)|id>

export enum DataType {
  Storage = '01', //	storage	keep stored in Nostr, might be update later
  Memory = '02', // memory	can be deleted after some time
}

export enum FlagType {
  SiteMetaData = '01', //	site metadata, contains site content-ids
  ArticlePage = '02', // article page, a list of articles
  PhotoPage = '03', // photo page, a list of photo url

  // util flag
  Share = 'f0', // sharing of flycat content(eg: an article/a photo)
  Comment = 'f1', // comment to flycat content(eg: an article/a photo)
}

export type FlycatHeader = ['flycat', Version, DataType, FlagType]; // can have extra data append, we only check 4 for compatibility

export type FlycatSiteMetaDataHeader = [
  'flycat',
  Version,
  DataType.Storage,
  FlagType.SiteMetaData,
];
export type FlycatArticlePageHeader = [
  'flycat',
  Version,
  DataType.Storage,
  FlagType.ArticlePage,
];
export type FlycatShareHeader = [
  'flycat',
  Version,
  DataType.Memory,
  FlagType.Share,
  PublicKey,
  ShareContentId,
];
export type FlycatCommentHeader = [
  'flycat',
  Version,
  DataType.Memory,
  FlagType.Comment,
];

export type ShareArticleTitle = string;
export type ShareBlogName = string;
export type ShareBlogPicture = string;
export type ShareArticleUrl = string;

export const CacheIdentifier = 'cache';
// FlycatCacheHeader = ['cache', ...any]
export type FlycatShareArticleCacheHeader = [
  'cache',
  ShareArticleTitle,
  ShareArticleUrl,
  ShareBlogName,
  ShareBlogPicture,
];

export function isFlycatSiteMetaDataHeader(
  data: any,
): data is FlycatSiteMetaDataHeader {
  return (
    isFlycatHeader(data) &&
    data[2] === DataType.Storage &&
    data[3] === FlagType.SiteMetaData
  );
}

export function isFlycatArticlePageHeader(
  data: any,
): data is FlycatArticlePageHeader {
  return (
    isFlycatHeader(data) &&
    data[2] === DataType.Storage &&
    data[3] === FlagType.ArticlePage
  );
}

export function isFlycatShareHeader(data: any): data is FlycatShareHeader {
  return (
    isFlycatHeader(data) &&
    data.length >= 6 &&
    data[2] === DataType.Memory &&
    data[3] === FlagType.Share &&
    // @ts-ignore
    typeof data[4] === 'string' &&
    // @ts-ignore
    typeof data[5] === 'string'
  );
}

export function isFlycatCommentHeader(data: any): data is FlycatCommentHeader {
  return (
    isFlycatHeader(data) &&
    data[2] === DataType.Memory &&
    data[3] === FlagType.Comment
  );
}

export function isFlycatHeader(data: any): data is FlycatHeader {
  return (
    Array.isArray(data) &&
    data.length >= 4 &&
    data[0] === 'flycat' &&
    typeof data[1] === 'string' &&
    Object.values(DataType).includes(data[2]) &&
    Object.values(FlagType).includes(data[3])
  );
}

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
  version: string;

  constructor({ version = '' }: { version: string }) {
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

  newShareContentId(type: FlagType, contentId: string) {
    return type + contentId;
  }

  newShareHeader(pk: PublicKey, id: ShareContentId) {
    const dataType = DataType.Memory;
    const flagType = FlagType.Share;
    const header = this.newHeader({ dataType, flagType });
    header.push(pk);
    header.push(id);
    return header;
  }

  newShareArticleCacheHeader(
    title: ShareArticleTitle,
    url: ShareArticleUrl,
    name: ShareBlogName,
    avatar: ShareBlogPicture,
  ): FlycatShareArticleCacheHeader {
    return [CacheIdentifier, title, url, name, avatar];
  }

  newCommentHeader() {
    const dataType = DataType.Storage;
    const flagType = FlagType.SiteMetaData;
    const header = this.newHeader({ dataType, flagType });
    return header;
  }

  newSiteMetaDataHeader() {
    const dataType = DataType.Storage;
    const flagType = FlagType.SiteMetaData;
    const header = this.newHeader({ dataType, flagType });
    return header;
  }

  newArticlePageHeader() {
    const dataType = DataType.Storage;
    const flagType = FlagType.ArticlePage;
    const header = this.newHeader({ dataType, flagType });
    return header;
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
    if (data.length === 0) return;

    let deserialized;
    try {
      deserialized = JSON.parse(data);
    } catch (e) {
      console.error('unknown type schema', data);
      return;
    }

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
  }): Promise<RawEvent> {
    const metaData: SiteMetaDataContentSchema = {
      site_name: name,
      site_description: description,
      page_ids: [],
      extra_data: '',
    };
    const content = Flycat.serialize(metaData);

    const header = this.newSiteMetaDataHeader();

    const e = new RawEvent(
      '',
      FlycatWellKnownEventKind.SiteMetaData,
      [header as any],
      content,
    );
    return e;
  }

  async updateSite(metaData: SiteMetaDataContentSchema): Promise<RawEvent> {
    const content = Flycat.serialize(metaData);
    const header = this.newSiteMetaDataHeader();

    return new RawEvent(
      '',
      FlycatWellKnownEventKind.SiteMetaData,
      [header as any],
      content,
    );
  }

  async updateArticlePage(ap: ArticlePageContentSchema): Promise<RawEvent> {
    const kind = FlycatWellKnownEventKind.SiteMetaData + ap.page_id;
    if (!validateArticlePageKind(kind)) {
      throw new Error('invalid kind');
    }

    const content = Flycat.serialize(ap);
    const header = this.newArticlePageHeader();

    return new RawEvent('', kind, [header as any], content);
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
