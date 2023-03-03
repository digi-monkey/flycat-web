import {
  Event,
  EventATag,
  EventTags,
  EventTTag,
  Filter,
  PublicKey,
  RawEvent,
  Tags,
  WellKnownEventKind,
} from 'service/api';
import { generateRandomBytes } from 'service/crypto';

export enum Nip23ArticleMetaTags {
  title = 'title',
  summary = 'summary',
  image = 'image',
  published_at = 'published_at',
  dir = 'dir',
}

type Dir = string;
type Dir1 = Dir;
type Dir2 = Dir;
type Dir3 = Dir;

export type DirTags = [Nip23ArticleMetaTags.dir, Dir1, Dir2, Dir3]; // post can be placed in path like: Dir1/Dir2/Dir3

export interface Article {
  id: string;
  eventId: string;
  content: string;
  pubKey: string;
  sig: string;
  updated_at: number; // secs
  title?: string;
  summary?: string;
  image?: string;
  published_at?: number; // secs
  dirs?: string[];
  hashTags?: string[];
  naddr?: string;
  otherTags?: string[][];
}

export class Nip23 {
  static kind: number = WellKnownEventKind.long_form;

  static create({
    title,
    slug,
    image,
    summary,
    hashTags,
    naddr,
    otherTags,
    content,
    dirTags,
  }: {
    title?: string;
    slug?: string;
    image?: string;
    summary?: string;
    hashTags?: string[];
    naddr?: string[];
    dirTags?: DirTags;
    otherTags?: Tags;
    content: string;
  }): RawEvent {
    const event: RawEvent = new RawEvent('', this.kind, undefined, content);

    let tags: Tags = [];
    tags.push([
      EventTags.D,
      slug && slug.length > 0 ? slug : this.randomArticleId(),
    ]);
    tags.push([
      Nip23ArticleMetaTags.published_at,
      JSON.stringify(event.created_at),
    ]);

    if (title) {
      tags.push([Nip23ArticleMetaTags.title, title]);
    }
    if (image) {
      tags.push([Nip23ArticleMetaTags.image, image]);
    }
    if (summary) {
      tags.push([Nip23ArticleMetaTags.summary, summary]);
    }
    if (dirTags && dirTags.length > 0) {
      tags.push(dirTags);
    }
    if (hashTags && hashTags.length > 0) {
      for (const t of hashTags) {
        tags.push([EventTags.T, t]);
      }
    }
    if (naddr && naddr.length > 0) {
      for (const a of naddr) {
        tags.push([EventTags.A, a, '']);
      }
    }
    if (otherTags && otherTags.length > 0) {
      tags = tags.concat(otherTags);
    }

    event.tags = tags;
    return event;
  }

  static update({
    title,
    image,
    summary,
    hashTags,
    content,
    naddr,
    dirTags,
    otherTags,
    articleId,
    published_at,
  }: {
    title?: string;
    image?: string;
    summary?: string;
    hashTags?: string[];
    published_at?: string;
    naddr?: string[];
    dirTags?: DirTags;
    otherTags?: Tags;
    content: string;
    articleId: string;
  }): RawEvent {
    const event: RawEvent = new RawEvent('', this.kind, undefined, content);

    let tags: Tags = [];
    tags.push([EventTags.D, articleId]); // keep the same articleId

    if (published_at) {
      tags.push([Nip23ArticleMetaTags.published_at, published_at]);
    }
    if (title) {
      tags.push([Nip23ArticleMetaTags.title, title]);
    }
    if (image) {
      tags.push([Nip23ArticleMetaTags.image, image]);
    }
    if (summary) {
      tags.push([Nip23ArticleMetaTags.summary, summary]);
    }
    if (dirTags && dirTags.length > 0) {
      tags.push(dirTags);
    }

    if (hashTags && hashTags.length > 0) {
      for (const t of hashTags) {
        tags.push([EventTags.T, t]);
      }
    }
    if (naddr && naddr.length > 0) {
      for (const a of naddr) {
        tags.push([EventTags.A, a]);
      }
    }
    if (otherTags && otherTags.length > 0) {
      tags = tags.concat(otherTags);
    }

    event.tags = tags;
    return event;
  }

  static filter({
    authors,
    articleIds,
    overrides,
  }: {
    authors?: PublicKey[];
    articleIds?: string[];
    overrides?: Omit<Filter, 'authors' | 'kinds' | 'ids'>;
  } = {}): Filter {
    const filter: Filter = {
      kinds: [Nip23.kind],
    };
    if (authors && authors.length > 0) {
      filter.authors = authors;
    }
    if (articleIds) {
      // "" is also a valid id
      filter['#d'] = articleIds;
    }
    if (overrides) {
      return { ...filter, ...overrides };
    }
    return filter;
  }

  static toArticle(event: Event): Article {
    if (event.kind !== Nip23.kind) {
      throw new Error(`wrong kind, expect: ${Nip23.kind}, got: ${event.kind}`);
    }
    const tags = event.tags;
    const id: string | undefined = tags
      .filter(t => t[0] === EventTags.D)
      .map(t => t[1])[0];
    if (id == null) {
      throw new Error(`missing d tag in event!`);
    }

    const title: string | undefined = tags
      .filter(t => t[0] === Nip23ArticleMetaTags.title)
      .map(t => t[1])[0];
    const summary: string | undefined = tags
      .filter(t => t[0] === Nip23ArticleMetaTags.summary)
      .map(t => t[1])[0];
    const image: string | undefined = tags
      .filter(t => t[0] === Nip23ArticleMetaTags.image)
      .map(t => t[1])[0];
    const published_at: string | undefined = tags
      .filter(t => t[0] === Nip23ArticleMetaTags.published_at)
      .map(t => t[1])[0];
    const dirs: string[] | undefined = tags
      .filter(t => t[0] === Nip23ArticleMetaTags.dir)[0]
      ?.slice(1); // remove the "dir" first item

    const hashTags: string[] | undefined = (
      tags.filter(t => t[0] === EventTags.T) as EventTTag[]
    ).map((t: EventTTag) => t[1]);
    const naddr: string = tags
      .filter(t => t[0] === EventTags.A)
      .map(t => t[1])[0];

    // todo: add p/e as well
    const otherTags: string[][] | undefined = tags.filter(
      t =>
        ![
          ...Object.values(Nip23ArticleMetaTags),
          ...[EventTags.T, EventTags.A, EventTags.D], //...Object.values(EventTags),
        ].includes(t[0].toString()),
    );

    const article: Article = {
      id: id,
      eventId: event.id,
      content: event.content,
      pubKey: event.pubkey,
      sig: event.sig,
      title,
      summary,
      image,
      dirs,
      published_at: published_at ? +published_at : undefined,
      updated_at: event.created_at,
      hashTags,
      naddr,
      otherTags,
    };
    return article;
  }

  static randomArticleId() {
    return generateRandomBytes(4).slice(2);
  }

  static toAddr(article: Article): EventATag {
    const articleId = article.id;
    return [EventTags.A, `${this.kind}:${article.pubKey}:${articleId}`, ''];
  }

  static commentToArticle(content: string, article: Article): RawEvent {
    const event: RawEvent = new RawEvent(
      '',
      WellKnownEventKind.text_note,
      undefined,
      content,
    );
    const tags = [
      [EventTags.E, article.eventId, ''],
      [EventTags.P, article.pubKey, ''],
      this.toAddr(article),
    ];
    if (article.title) {
      tags.push([Nip23ArticleMetaTags.title, article.title]);
    }
    if (article.summary) {
      tags.push([Nip23ArticleMetaTags.summary, article.summary]);
    }
    if (article.image) {
      tags.push([Nip23ArticleMetaTags.image, article.image]);
    }
    if (article.published_at) {
      tags.push([
        Nip23ArticleMetaTags.published_at,
        article.published_at.toString(),
      ]);
    }

    event.tags = tags;
    return event;
  }

  static toPullCommentFilter(article: Article): Filter {
    return {
      kinds: [WellKnownEventKind.text_note],
      '#e': [article.eventId],
      '#a': this.toAddr(article),
    };
  }

  static isCommentEvent(event: Event, article: Article): boolean {
    const eTags = event.tags.filter(
      t => t[0] === EventTags.E && t[1] === article.pubKey,
    );
    const aTags = event.tags.filter(t => t === this.toAddr(article));
    return eTags.length > 0 || aTags.length > 0;
  }

  static addrToUrl(addr: string) {
    const list = addr.split(':');
    return `/post/${list[1]}/${list[2]}`;
  }

  // check a tag for long form kind
  static isBlogMsg(event: Event): boolean {
    return (
      event.kind === WellKnownEventKind.text_note &&
      event.tags.filter(
        t =>
          t[0] === EventTags.A && t[1].split(':')[0] === this.kind.toString(),
      ).length > 0
    );
  }
}
