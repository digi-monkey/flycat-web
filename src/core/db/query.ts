import { DbEvent } from './schema';
import { Event } from 'core/nostr/Event';
import { normalizeWsUrl } from 'utils/common';
import { Collection, IndexableType, Table } from 'dexie';
import {
  EventId,
  EventTags,
  Filter,
  Naddr,
  WellKnownEventKind,
} from 'core/nostr/type';
import { validateFilter } from 'components/MsgFeed/util';

export class Query {
  private readonly table: Table<DbEvent>;
  public defaultMaxLimit = 50;

  constructor(table: Table<DbEvent>, defaultMaxLimit?: number) {
    this.table = table;
    if (defaultMaxLimit) {
      this.defaultMaxLimit = defaultMaxLimit;
    }
  }

	async profileEvents(pks: string[], relayUrls: string[]){
		const filter: Filter = {
			authors: pks,
			kinds: [WellKnownEventKind.set_metadata],
			limit: pks.length
		}
		const data = await this.matchFilterRelay(filter, relayUrls);	
		return data;
	}

	async profileEvent(pk: string, relayUrls: string[]){
		const filter: Filter = {
			authors: [pk],
			kinds: [WellKnownEventKind.set_metadata],
			limit: 1
		}
		const data = await this.matchFilterRelay(filter, relayUrls);	
		if(data.length === 0)return null;
		return data[0];
	}

	createProfileEventQuerier(
		pks: string[],
    relayUrls: string[],
  ): () => Promise<DbEvent[]> {
    return async () => {
			if(pks.length === 0)return [];
		
      const filter: Filter = {
				authors: pks,
				kinds: [WellKnownEventKind.set_metadata],
				limit: pks.length
      };
      return await this.matchFilterRelay(filter, relayUrls);
    };
  }


	createEventByIdQuerier(relayUrls: string[], eventId?: EventId){
		return async () => {
			if(!eventId){
				return null;
			}

      const filter: Filter = {
				ids: [eventId],
				limit: 1
      };
      const events = await this.matchFilterRelay(filter, relayUrls);
			console.log("createEventByIdQuerier: ", events.length)
      const result = events.sort((a, b) => b.created_at - a.created_at);
			if(result.length === 0){
				return null;
			}
			return result[0];
    };	
	}

  createContactEventQuerier(
    publicKey: string,
    relayUrls: string[],
		callback?: (events: DbEvent[]) => any,
  ): () => Promise<DbEvent[]> {
    return async () => {
      const filter: Filter = {
        authors: [publicKey],
        kinds: [WellKnownEventKind.contact_list],
      };
      const events = await this.matchFilterRelay(filter, relayUrls);
      const result = events.sort((a, b) => b.created_at - a.created_at);
			if(callback){
				callback(result);
			}
			return result;
    };
  }

  createEventQuerier(
    msgFilter: Filter,
    relayUrls: string[],
    isValidEvent?: ((event: Event) => boolean) | undefined,
  ): () => Promise<DbEvent[]> {
    return async () => {
			const result: DbEvent[] = [];
      if (!msgFilter || (msgFilter && !validateFilter(msgFilter))){
				return result;
			}
        
      const data = await this.matchFilterRelay(msgFilter, relayUrls);
      if (isValidEvent) {
        return data.filter(e => isValidEvent(e));
      }
      return data;
    };
  }

  async matchFilterRelay(filter: Filter, relayUrls: string[]) {
    const maxEvents = filter.limit || this.defaultMaxLimit;
    const applyRelayAndTimeLimit = (event: DbEvent) => {
      const seenRelays = event.seen.map(r => normalizeWsUrl(r));
      if (
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
      return await collection
        .and(applyRelayAndTimeLimit)
        .reverse()
        .limit(maxEvents)
        .sortBy('created_at');
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

    if (filter.ids) {
      const query = this.table.where('id').anyOf(filter.ids);
      return await defaultQuery(query);
    }

    if (filter.authors && filter.kinds) {
      const compoundKeys = filter.authors.flatMap(pubkey =>
        filter.kinds!.map(kind => [pubkey, kind]),
      );
      const query = this.table.where('[pubkey+kind]').anyOf(compoundKeys);
      const events = await defaultQuery(query);
      return filterTags(events, filter);
    }

    if (filter.kinds) {
      const query = this.table.where('kind').anyOf(filter.kinds);
      const events = await defaultQuery(query);
      return filterTags(events, filter);
    }

    if (filter.authors) {
      const query = this.table.where('pubkey').anyOf(filter.authors);
      const events = await defaultQuery(query);
      return filterTags(events, filter);
    }

    const events = await defaultQuery(this.table.toCollection());
    return filterTags(events, filter);
  }
}
