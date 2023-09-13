import { DbEvent } from './schema';
import { Event } from 'core/nostr/Event';
import { normalizeWsUrl } from 'utils/common';
import { Collection, IndexableType, Table } from 'dexie';
import { EventId, EventTags, Filter, Naddr } from 'core/nostr/type';
import { validateFilter } from 'components/MsgFeed/util';
import { deserializeMetadata } from 'core/nostr/content';

export class Query {
  private readonly table: Table<DbEvent>;
  public defaultMaxLimit = 50;

  constructor(table: Table<DbEvent>, defaultMaxLimit?: number) {
    this.table = table;
    if (defaultMaxLimit) {
      this.defaultMaxLimit = defaultMaxLimit;
    }
  }

  createEventByIdQuerier(relayUrls: string[], eventId?: EventId) {
    return async () => {
      console.log('EventByIdQuerier..');
      if (!eventId) {
        return null;
      }

      const filter: Filter = {
        ids: [eventId],
        limit: 1,
      };
      const events = await this.matchFilterRelay(filter, relayUrls);
      console.log('createEventByIdQuerier: ', events.length);
      const result = events.sort((a, b) => b.created_at - a.created_at);
      if (result.length === 0) {
        return null;
      }
      return result[0];
    };
  }

  createEventQuerier(
    msgFilter: Filter,
    relayUrls: string[],
    isValidEvent?: ((event: Event) => boolean) | undefined,
  ): () => Promise<DbEvent[]> {
    return async () => {
      console.log('EventQuerier..');
      const result: DbEvent[] = [];
      if (!msgFilter || (msgFilter && !validateFilter(msgFilter))) {
        return result;
      }

      return await this.matchFilterRelay(msgFilter, relayUrls, isValidEvent);
    };
  }

  // pass [] to allow for any relay urls
  async matchFilterRelay(
    filter: Filter,
    relayUrls: string[],
    isValidEvent?: (event: Event) => boolean,
  ) {
    const maxLimit = filter.limit || this.defaultMaxLimit;
    const applyRelayAndTimeRange = (event: DbEvent) => {
      const seenRelays = event.seen.map(r => normalizeWsUrl(r));
      if (
        relayUrls.length > 0 &&
        !relayUrls.some(relay => seenRelays.includes(normalizeWsUrl(relay)))
      ) {
        return false;
      }
      const startTime = filter.since || 0;
      const endTime = filter.until || Date.now();
      return event.created_at > startTime && event.created_at < endTime;
    };
    const defaultQuery = async (
      collection: Collection<DbEvent, IndexableType>,
    ) => {
      return (
        await collection.and(applyRelayAndTimeRange).sortBy('created_at')
      ).reverse();
    };
    const filterTags = (events: DbEvent[], filter: Filter) => {
      let result = events;
      if (filter['#e']) {
        const target = filter['#e'];
        result = result.filter(event =>
          event.tags.some(
            tag => tag[0] === EventTags.E && target.includes(tag[1] as EventId),
          ),
        );
      }
      if (filter['#p']) {
        const target = filter['#p'];
        result = result.filter(event =>
          event.tags.some(
            tag => tag[0] === EventTags.P && target.includes(tag[1] as string),
          ),
        );
      }
      if (filter['#d']) {
        const target = filter['#d'];
        result = result.filter(event =>
          event.tags.some(
            tag => tag[0] === EventTags.D && target.includes(tag[1] as string),
          ),
        );
      }
      if (filter['#t']) {
        const target = filter['#t'];
        result = result.filter(event =>
          event.tags.some(
            tag => tag[0] === EventTags.T && target.includes(tag[1] as string),
          ),
        );
      }
      if (filter['#a']) {
        const target = filter['#a'];
        result = result.filter(event =>
          event.tags.some(
            tag => tag[0] === EventTags.A && target.includes(tag[1] as Naddr),
          ),
        );
      }
      return result;
    };
    const applyMaxLimit = (events: DbEvent[]) => {
      if (isValidEvent) {
        return events
          .filter(e => isValidEvent(e))
          .filter(e => e != null)
          .slice(0, maxLimit);
      }
      return events.slice(0, maxLimit);
    };

    if (filter.ids) {
      const query = this.table.where('id').anyOf(filter.ids);
      return applyMaxLimit(await defaultQuery(query));
    }

    if (filter.authors && filter.kinds) {
      const compoundKeys = filter.authors.flatMap(pubkey =>
        filter.kinds!.map(kind => [pubkey, kind]),
      );
      const query = this.table.where('[pubkey+kind]').anyOf(compoundKeys);
      const events = await defaultQuery(query);
      return applyMaxLimit(filterTags(events, filter));
    }

    if (filter.kinds) {
      const query = this.table.where('kind').anyOf(filter.kinds);
      const events = await defaultQuery(query);
      return applyMaxLimit(filterTags(events, filter));
    }

    if (filter.authors) {
      const query = this.table.where('pubkey').anyOf(filter.authors);
      const events = await defaultQuery(query);
      return applyMaxLimit(filterTags(events, filter));
    }

    const events = await defaultQuery(this.table.toCollection());
    return applyMaxLimit(filterTags(events, filter));
  }
}

export class ContactQuery {
  table: Table<DbEvent>;
  constructor(table: Table<DbEvent>) {
    this.table = table;
  }

  getContactByPubkey(pubkey: string) {
    return this.table.get(pubkey);
  }

  createContactByPubkeyQuerier(
    pubkey: string,
    callback?: (event: DbEvent) => any,
  ) {
    return () => {
      return this.table.get(pubkey).then(event => {
        if (event) {
          if (callback) {
            callback(event);
          }
          return event;
        }
        return null;
      });
    };
  }
}

export class ProfileQuery {
  table: Table<DbEvent>;
  constructor(table: Table<DbEvent>) {
    this.table = table;
  }

  getProfileByPubkey(pubkey: string) {
    return this.table.get(pubkey);
  }

  async getBatchProfiles(pubkeys: string[]) {
    const events = await this.table.bulkGet(pubkeys);
    return events.filter(e => e != null) as DbEvent[];
  }

  createProfileByPubkeyQuerier(
    pubkey: string,
    callback?: (event: DbEvent) => any,
  ) {
    return () => {
      return this.table.get(pubkey).then(event => {
        if (event) {
          if (callback) {
            callback(event);
          }
          return event;
        }
        return null;
      });
    };
  }

  createBatchProfileQuerier(
    pubkeys: string[],
    callback?: (events: DbEvent[]) => any,
  ) {
    return () => {
      return this.table.bulkGet(pubkeys).then(events => {
        const result = events.filter(e => e != null) as DbEvent[];
        if (callback) {
          callback(result);
        }
        return result;
      });
    };
  }

  filter(fn: (obj: DbEvent) => boolean) {
    return this.table.filter(fn).toArray();
  }

  createFilterQuerier(fn: (obj: DbEvent) => boolean) {
    return () => {
      return this.table.filter(fn).toArray();
    };
  }

  createFilterByKeyWord(keyword?: string) {
    const fn = (e: DbEvent) => (keyword ? e.content.includes(keyword) : false);
    return this.createFilterQuerier(fn);
  }

  createFilterByName(name?: string) {
    const fn = (e: DbEvent) => {
      if (!name) return false;

      try {
        const profile = deserializeMetadata(e.content);
        return profile.display_name.includes(name) || profile.name.includes(name);
      } catch (error) {
        return false;
      }
    };
    return this.createFilterQuerier(fn);
  }
}
