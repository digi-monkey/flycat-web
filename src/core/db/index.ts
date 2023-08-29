import Dexie, { Table } from 'dexie';
import { Event } from "core/nostr/Event";
import { DbEvent } from './schema';

const version = 1;

export class DexieDb extends Dexie {
  // 'event' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  event!: Table<DbEvent>;

  constructor() {
    super('nostrDatabase');
    this.version(version).stores({
      event: 'id, pubkey, kind, created_at' // Primary key and indexed props
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
