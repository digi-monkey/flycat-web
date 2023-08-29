import Dexie, { Collection, IndexableType, Table } from 'dexie';
import { Event } from "core/nostr/Event";
import { DbEvent } from './schema';
import { EventId, EventTags, Filter, Naddr } from 'core/nostr/type';

const version = 1;

export class DexieDb extends Dexie {
  // 'event' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  event!: Table<DbEvent>;

  constructor() {
    super('nostrDatabase');
    this.version(version).stores({
      event: 'id, pubkey, kind, created_at, [pubkey+kind]' // Primary key and indexed props
    });
  }
}

export const dexieDb = new DexieDb();
export const dbEventTable = dexieDb.event;

export async function storeEvent(event: Event, relayUrl: string) {
  const record = await dbEventTable.get(event.id);
  if (record) {
    console.log('Record found:', record);
    if (record.seen.includes(relayUrl)) {
      return console.debug("already stored.");
    } else {
      const seen = record.seen;
      seen.push(relayUrl);
      const timestamp = Date.now();
      const updatedCount = await dbEventTable.update(event.id, { seen, timestamp });
      if (updatedCount > 0) {
        console.debug('Record updated successfully');
      } else {
        console.debug('Record not found or no changes made');
      }
    }
  } else {
    console.debug('Record not found');
    await dbEventTable.add({
      ...event, ...{
        seen: [relayUrl],
        timestamp: Date.now(),
      }
    });
  }
}

export async function queryEvent(filter: Filter, relayUrls: string[]) {
  const maxEvents = filter.limit || 50;
  const applyRelayAndTimeLimit = (event: DbEvent) => {
    if (!relayUrls.some(relay => event.seen.includes(relay))) {
      return false;
    }
    const startTime = filter.since || 0;
    const endTime = filter.until || Date.now();
    return event.created_at > startTime && event.created_at < endTime;
  };
  const defaultQuery = async (collection: Collection<DbEvent, IndexableType>) => {
    return await collection.and(applyRelayAndTimeLimit).limit(maxEvents).sortBy('created_at')
  }
  const filterTags = (events: DbEvent[], filter: Filter) => {
    let result = events;
    if (filter['#e']) {
      const target = filter['#e'];
      result = result.filter(event => event.tags.some(tag => tag[0] === EventTags.E && target.includes(tag[1] as EventId)));
    }
    if (filter['#p']) {
      const target = filter['#p'];
      result = result.filter(event => event.tags.some(tag => tag[0] === EventTags.P && target.includes(tag[1] as string)));
    }
    if (filter['#d']) {
      const target = filter['#d'];
      result = result.filter(event => event.tags.some(tag => tag[0] === EventTags.D && target.includes(tag[1] as string)));
    }
    if (filter['#t']) {
      const target = filter['#t'];
      result = result.filter(event => event.tags.some(tag => tag[0] === EventTags.T && target.includes(tag[1] as string)));
    }
    if (filter['#a']) {
      const target = filter['#a'];
      result = result.filter(event => event.tags.some(tag => tag[0] === EventTags.A && target.includes(tag[1] as Naddr)));
    }
    return result;
  }

  if (filter.ids) {
    const query = dbEventTable.where('id').anyOf(filter.ids);
    return await defaultQuery(query);
  }

  if (filter.authors && filter.kinds) {
    const compoundKeys = filter.authors.flatMap(pubkey => filter.kinds!.map(kind => [pubkey, kind]));
    const query = dbEventTable.where('[pubkey+kind]').anyOf(compoundKeys);
    const events = await defaultQuery(query);
    return filterTags(events, filter);
  }

  if (filter.kinds) {
    const query = dbEventTable.where('kind').anyOf(filter.kinds);
    const events = await defaultQuery(query);
    return filterTags(events, filter);
  }

  if (filter.authors) {
    const query = dbEventTable.where('pubkey').anyOf(filter.authors);
    const events = await defaultQuery(query);
    return filterTags(events, filter);
  }

  const events = await defaultQuery(dbEventTable.toCollection());
  return filterTags(events, filter);
}
