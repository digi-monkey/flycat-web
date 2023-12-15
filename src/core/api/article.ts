import { Event } from 'core/nostr/Event';
import { Nip23 } from 'core/nip/23';
import fetch from 'cross-fetch';

export async function getArticle(publicKey: string, articleId: string) {
  const url =
    'https://nostr-post-api.deno.dev' + `?pubkey=${publicKey}&id=${articleId}`;
  try {
    const res = await fetch(url);
    const e: Event = await res.json();
    if (Nip23.isBlogPost(e)) {
      return e;
    }
  } catch (err) {
    console.log(err);
  }

  return null;
}
