import { DbEvent } from './schema';
import { Event } from 'core/nostr/Event';
import { normalizeWsUrl } from 'utils/common';
import { Collection, IndexableType, Table } from 'dexie';
import { EventId, EventTags, Filter, Naddr } from 'core/nostr/type';
import { validateFilter } from 'components/TimelineRender/util';
import { deserializeMetadata } from 'core/nostr/content';
import { Nip19, Nip19DataType } from 'core/nip/19';
import { isValidPublicKey } from 'utils/validator';
import { isNip05DomainName } from 'core/nip/05';

export class Query {
  private readonly table: Table<DbEvent>;
  public defaultMaxLimit = 50;

  constructor(table: Table<DbEvent>, defaultMaxLimit?: number) {
    this.table = table;
    if (defaultMaxLimit) {
      this.defaultMaxLimit = defaultMaxLimit;
    }
  }

  tableName() {
    return this.table.name;
  }

  createEventByIdQuerier(
    relayUrls: string[],
    eventId?: EventId,
  ): () => Promise<[DbEvent | undefined | null, boolean]> {
    return async () => {
      const finished = true;

      if (!eventId) {
        return [null, finished];
      }

      const normalizeRelayUrls = relayUrls.map(r => normalizeWsUrl(r));
      const event = await this.table.get(eventId);
      if (event && relayUrls.length > 0) {
        const seenRelays = event.seen.map(r => normalizeWsUrl(r));
        if (normalizeRelayUrls.some(relay => seenRelays.includes(relay))) {
          return [event, finished];
        }
        return [null, finished];
      }
      return [event, finished];
    };
  }

  createEventQuerier(
    msgFilter: Filter,
    relayUrls: string[],
    isValidEvent?: ((event: Event) => boolean) | undefined,
  ): () => Promise<DbEvent[]> {
    return async () => {
      const result: DbEvent[] = [];
      if (!msgFilter || (msgFilter && !validateFilter(msgFilter))) {
        return result;
      }

      return await this.matchFilterRelay(msgFilter, relayUrls, isValidEvent);
    };
  }

  // pass [] to allow match for any relay urls
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
    const applyIsValidEvent = (event: DbEvent) => {
      if (typeof isValidEvent === 'function') {
        try {
          const isValid = isValidEvent(event);
          return isValid;
        } catch (error: any) {
          console.debug(
            'query isValidEvent error: ',
            error.message,
            event.content,
            event.kind,
          );
          return false;
        }
      }
      return true;
    };
    const applyFilterTags = (event: DbEvent) => {
      let isValid = !(
        !!filter['#e'] ||
        !!filter['#p'] ||
        !!filter['#d'] ||
        !!filter['#t'] ||
        !!filter['#a']
      );
      if (filter['#e']) {
        const target = filter['#e'];
        isValid = event.tags.some(
          tag => tag[0] === EventTags.E && target.includes(tag[1] as EventId),
        );
      }
      if (filter['#p']) {
        const target = filter['#p'];
        isValid = event.tags.some(
          tag => tag[0] === EventTags.P && target.includes(tag[1] as string),
        );
      }
      if (filter['#d']) {
        const target = filter['#d'];
        isValid = event.tags.some(
          tag => tag[0] === EventTags.D && target.includes(tag[1] as string),
        );
      }
      if (filter['#t']) {
        const target = filter['#t'];
        isValid = event.tags.some(
          tag => tag[0] === EventTags.T && target.includes(tag[1] as string),
        );
      }
      if (filter['#a']) {
        const target = filter['#a'];
        isValid = event.tags.some(
          tag => tag[0] === EventTags.A && target.includes(tag[1] as Naddr),
        );
      }
      return isValid;
    };
    const doQuery = async (collection: Collection<DbEvent, IndexableType>) => {
      const filterResults = collection
        .filter(applyRelayAndTimeRange)
        .filter(applyIsValidEvent)
        .filter(applyFilterTags)
        .limit(maxLimit);
      const data = await filterResults.toArray();
      return data;
    };

    const doQuerySort = async (
      collection: Collection<DbEvent, IndexableType>,
    ) => {
      const filterResults = (
        await collection
          .filter(applyRelayAndTimeRange)
          .filter(applyIsValidEvent)
          .filter(applyFilterTags)
          .sortBy('created_at')
      ).reverse();
      const data = filterResults.slice(0, maxLimit);
      return data;
    };

    if (filter.ids) {
      const query = this.table.where('id').anyOf(filter.ids);
      return await doQuerySort(query);
    }

    if (filter.authors && filter.kinds) {
      const compoundKeys = filter.authors.flatMap(pubkey =>
        filter.kinds!.map(kind => [pubkey, kind]),
      );
      const query = this.table.where('[pubkey+kind]').anyOf(compoundKeys);
      const events = await doQuerySort(query);
      return events;
    }

    if (filter.kinds) {
      const query = this.table.where('kind').anyOf(filter.kinds);
      const events = await doQuerySort(query);
      return events;
    }

    if (filter.authors) {
      const query = this.table.where('pubkey').anyOf(filter.authors);
      const events = await doQuerySort(query);
      return events;
    }

    const sortedCollection = this.table.orderBy('created_at').reverse();
    const events = await doQuery(sortedCollection);
    return events;
  }
}

export class ContactQuery {
  table: Table<DbEvent>;
  constructor(table: Table<DbEvent>) {
    this.table = table;
  }

  tableName() {
    return this.table.name;
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

  tableName() {
    return this.table.name;
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

  createFilterByKeyword(keyword?: string) {
    const fn = (e: DbEvent) => {
      if (!keyword) return false;

      const lowercase = keyword.toLowerCase().trim();
      if (isValidPublicKey(lowercase) || lowercase.startsWith('npub')) {
        return (
          e.pubkey.toLowerCase() === lowercase ||
          Nip19.encode(e.pubkey, Nip19DataType.Npubkey).toLowerCase() ===
            lowercase
        );
      }
      try {
        const profile = deserializeMetadata(e.content);
        if (isNip05DomainName(lowercase)) {
          return profile.nip05.toLowerCase().trim() === lowercase;
        }
        return (
          profile.display_name.toLowerCase().includes(lowercase) ||
          profile.name.toLowerCase().includes(lowercase) ||
          profile.about.toLowerCase().includes(lowercase)
        );
      } catch (error) {
        return false;
      }
    };
    return this.createFilterQuerier(fn);
  }
}
