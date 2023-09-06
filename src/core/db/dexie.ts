import Dexie, { Table } from 'dexie';
import { DbEvent } from './schema';
import {Event} from 'core/nostr/Event';
import { WellKnownEventKind } from 'core/nostr/type';

const version = 1;

export class DexieDb extends Dexie {
  // 'event' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  event!: Table<DbEvent>;
	profileEvent!: Table<DbEvent>;
	contactEvent!: Table<DbEvent>;

  constructor() {
    super('nostrDatabase');
    this.version(version).stores({
      event: 'id, pubkey, kind, created_at, [pubkey+kind]', // Primary key and indexed props
			profileEvent: 'pubkey, id, create_at',
			contactEvent: 'pubkey, id, created_at'
    });
  }

	async store(event: Event, relayUrl: string){
		if(event.kind === WellKnownEventKind.contact_list){
			return await this.storeContactEvent(event, relayUrl);
		}
		if(event.kind === WellKnownEventKind.set_metadata){
			return await this.storeProfileEvent(event, relayUrl);
		}

		return this.storeEvent(event, relayUrl);
	}

	async storeProfileEvent(event: Event, relayUrl: string){
		if(event.kind !== WellKnownEventKind.set_metadata){
			return;
		}

		const record = await this.profileEvent.get(event.pubkey);
		if(record && record.created_at >= event.created_at){
			return;
		}
		return await this.save(event, relayUrl, this.profileEvent);
	}

	async storeContactEvent(event: Event, relayUrl: string){
		if(event.kind !== WellKnownEventKind.contact_list){
			return;
		}

		const record = await this.contactEvent.get(event.pubkey);
		if(record && record.created_at >= event.created_at){
			return;
		}
		return await this.save(event, relayUrl, this.contactEvent);
	}

	async storeEvent(event: Event, relayUrl: string) {
		return await this.save(event, relayUrl, this.event);
	}

	private async save(event: Event, relayUrl: string, table: Table<DbEvent>){
		const primaryKey = (event.kind === WellKnownEventKind.contact_list || event.kind === WellKnownEventKind.set_metadata) ? event.pubkey : event.id;
		const record = await table.get(primaryKey);
		if (record) {
			if (record.seen.includes(relayUrl)) {
				return console.debug("already store: ", event.kind, record.seen, relayUrl, primaryKey);
			} else {
				const seen = record.seen;
				seen.push(relayUrl);
				const timestamp = Date.now();
				const updatedCount = await table.update(primaryKey, { seen, timestamp });
				if (updatedCount > 0) {
					console.debug('Record updated successfully', primaryKey);
				} else {
					console.debug('Record not found or no changes made', primaryKey);
				}
			}
		} else {
			console.debug('New Record Added ', event.kind, primaryKey);
			await table.add({
				...event, ...{
					seen: [relayUrl],
					timestamp: Date.now(),
				}
			});
		}
	}
}
