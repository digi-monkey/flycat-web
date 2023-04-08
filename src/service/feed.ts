import { Event } from './api';
import { Feed, Item } from 'feed';
import { Article, Nip23 } from './nip/23';

import { marked } from 'marked';

export function eventToFeed(events: Event[], authorPk?: string) {
  validateFeedEvents(events);

  const pk = authorPk || events[0]?.pubkey || 'unknown public key';
  const feed = new Feed({
    title: `nostr blog feeds from ${pk}`,
    description: 'This is nostr blog feed!',
    id: `${pk}`,
    link: `https://flycat.club/blog/${pk}`,
    language: 'en', // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
    // image: "http://example.com/image.png",
    // favicon: "http://example.com/favicon.ico",
    copyright: `All rights reserved ${pk}`,
    updated: new Date(2013, 6, 14), // optional, default = today
    generator: 'flycat', // optional, default = 'Feed for Node.js'
    feedLinks: {
      rss: `https://flycat.club/api/rss/${pk}`,
      atom: `https://flycat.club/api/atom/${pk}`,
      json: `https://flycat.club/api/json/${pk}`,
    },
    author: {
      name: pk,
      link: `/user/${pk}`,
    },
  });

  for (const e of events) {
    const article = Nip23.toArticle(e);
    feed.addItem(articleToFeedItem(article));
  }
  return feed;
}

export function articleToFeedItem(article: Article): Item {
  return {
    title: article.title || '',
    id: article.id,
    link: `/post/${article.pubKey}/${article.id}`, // todo: maybe use addr, but it is not compatible with web2
    date: new Date(article.updated_at * 1000),
    description: article.summary,
    content: marked.parse(article.content), // some reader not support markdown so convert to html first
    // category?: Category[];
    guid: Nip23.toAddr(article)[1],
    image: article.image,
    // audio?: string | Enclosure; //todo: maybe extract from content
    // video?: string | Enclosure; //todo: maybe extract from content
    // enclosure?: Enclosure;
    author: [
      {
        name: article.pubKey,
        link: `/user/${article.pubKey}`, // todo: maybe use addr, but it is not compatible with web2
      },
    ],
    // contributor?: Author[];
    published: article.published_at
      ? new Date(article.published_at * 1000)
      : undefined,
    // copyright?: string;
    // extensions?: Extension[];
  };
}

export function validateNip23Event(event: Event) {
  if (event.kind !== Nip23.kind)
    throw new Error('invalid nip23 event kind ${event.kind}');
}

export function validateFeedEvents(events: Event[]) {
  if (events.length === 0) return;

  const pk = events[0].pubkey;
  for (const event of events) {
    validateNip23Event(event);
    if (event.pubkey !== pk)
      throw new Error('events should use the same pubkey');
  }
}
