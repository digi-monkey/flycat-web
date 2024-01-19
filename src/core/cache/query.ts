import { DbEvent } from 'core/db/schema';
import { Filter } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { createHash } from 'crypto';

export const lastViewTimestampCache = new Map<string, number>();
export const scrollHeightCache = new Map<string, number>();

export function createQueryCacheId(deps: {
  feedId: string; // we need this since noscript custom feed might have all other 3 items looks the same but underlying the isValidEvent wasm binding is different
  msgFilter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  relayUrls?: string[];
}): string {
  const feedId = deps;
  const msgFilterStr = JSON.stringify(deps.msgFilter);
  const isValidEventStr = deps.isValidEvent?.toString() || '';
  const relayUrlsStr = JSON.stringify(deps.relayUrls); // todo: order doesn't matter

  const combinedString = `${feedId}-${msgFilterStr}-${isValidEventStr}-${relayUrlsStr}`;
  const hash = createHash('sha256');
  hash.update(combinedString);
  const uniqueId = hash.digest('hex');

  return uniqueId;
}
