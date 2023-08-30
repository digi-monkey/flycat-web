import { Event } from "core/nostr/Event";
import { DexieDb } from './dexie';
import { Query } from './query';

export const dexieDb = new DexieDb();
export const dbEventTable = dexieDb.event;
export const dbQuery = new Query(dbEventTable);

export async function storeEvent(event: Event, relayUrl: string) {
  const record = await dbEventTable.get(event.id);
  if (record) {
    if (record.seen.includes(relayUrl)) {
      return console.debug("already store: ", event.kind, record.seen, relayUrl, event.id);
    } else {
      const seen = record.seen;
      seen.push(relayUrl);
      const timestamp = Date.now();
      const updatedCount = await dbEventTable.update(event.id, { seen, timestamp });
      if (updatedCount > 0) {
        console.debug('Record updated successfully', event.id);
      } else {
        console.debug('Record not found or no changes made', event.id);
      }
    }
  } else {
    console.debug('New Record Added ', event.kind, event.id);
    await dbEventTable.add({
      ...event, ...{
        seen: [relayUrl],
        timestamp: Date.now(),
      }
    });
  }
}
