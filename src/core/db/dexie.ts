import Dexie, { Table } from 'dexie';
import { DbEvent } from './schema';
import { Event } from 'core/nostr/Event';
import { WellKnownEventKind } from 'core/nostr/type';
import { Nip01 } from 'core/nip/01';
import { getEventDTagId } from 'core/nostr/util';

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
      contactEvent: 'pubkey, id, created_at',
    });
  }

  async indexedDbTotalSize() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate: any = await navigator.storage.estimate();
      const detail = estimate.usageDetails;
      const usageInMB = (detail.indexedDB / (1024 * 1024)).toFixed(2);
      return usageInMB;
    }
    return null;
  }

  async estimateSize() {
    const event = await this.estimateTableSize(this.event);
    const profile = await this.estimateTableSize(this.profileEvent);
    const contact = await this.estimateTableSize(this.contactEvent);
    return event + profile + contact;
  }

  private async estimateTableSize(table: Table, sizePerItem?: number) {
    const recordCount = await table.count();
    const estimatedRecordSizeInBytes = sizePerItem || 800; // Adjust this value based on your record structure
    const sizeInBytes = recordCount * estimatedRecordSizeInBytes;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return +sizeInMB.toFixed(2); // Round to 2 decimal places
  }

  async store(event: Event, relayUrl: string) {
    if (event.kind === WellKnownEventKind.contact_list) {
      return await this.storeContactEvent(event, relayUrl);
    }
    if (event.kind === WellKnownEventKind.set_metadata) {
      return await this.storeProfileEvent(event, relayUrl);
    }

    return await this.storeEvent(event, relayUrl);
  }

  async storeProfileEvent(event: Event, relayUrl: string) {
    if (event.kind !== WellKnownEventKind.set_metadata) {
      return;
    }

    const record = await this.profileEvent.get(event.pubkey);
    if (record && record.created_at >= event.created_at) {
      return;
    }
    return await this.save(event, relayUrl, this.profileEvent);
  }

  async storeContactEvent(event: Event, relayUrl: string) {
    if (event.kind !== WellKnownEventKind.contact_list) {
      return;
    }

    const record = await this.contactEvent.get(event.pubkey);
    if (record && record.created_at >= event.created_at) {
      return;
    }
    return await this.save(event, relayUrl, this.contactEvent);
  }

  async storeEvent(event: Event, relayUrl: string) {
    try {
      await this.save(event, relayUrl, this.event);
    } catch (error: any) {
      console.debug('store failed: ', error.message, event);
    }
  }

  async fixTableDuplicatedData(table: Table<DbEvent>) {
    const events = await table
      .filter(e => Nip01.isParameterizedREplaceableEvent(e))
      .toArray();

    const findDuplicateStrings = (arr: string[]): string[] => {
      const uniqueSet = new Set<string>();
      const duplicates: string[] = [];

      arr.forEach(item => {
        if (uniqueSet.has(item) && !duplicates.includes(item)) {
          duplicates.push(item);
        } else {
          uniqueSet.add(item);
        }
      });

      return duplicates;
    };

    const data = events.map(
      e => e.pubkey + ':' + e.kind + ':' + getEventDTagId(e.tags),
    );
    const keys = findDuplicateStrings(data);

    for (const key of keys) {
      const d = events
        .filter(
          e => e.pubkey + ':' + e.kind + ':' + getEventDTagId(e.tags) === key,
        )
        .sort((a, b) => b.created_at - a.created_at);
      const duplicatedIds = d.slice(1).map(e => e.id);
      await table.bulkDelete(duplicatedIds);
    }
    return keys.length;
  }

  private async saveParameterizedReplaceableEvent(
    event: Event,
    relayUrl: string,
    table: Table<DbEvent>,
  ) {
    if (!Nip01.isParameterizedREplaceableEvent(event))
      throw new Error(
        'not a ParameterizedReplaceableEvent, kind: ' + event.kind,
      );

    const primaryKey = event.id;
    const record = await table.get(primaryKey);
    if (record) {
      if (record.seen.includes(relayUrl)) {
        return console.debug(
          'already store: ',
          event.kind,
          record.seen,
          relayUrl,
          primaryKey,
        );
      } else {
        const seen = record.seen;
        seen.push(relayUrl);
        const timestamp = Date.now();
        const updatedCount = await table.update(primaryKey, {
          seen,
          timestamp,
        });
        if (updatedCount > 0) {
          console.debug('Record updated successfully', primaryKey);
        } else {
          console.debug('Record not found or no changes made', primaryKey);
        }
      }
      return;
    }

    const replaceableRecords = await table
      .filter(
        e =>
          e.pubkey === event.pubkey &&
          e.kind === event.kind &&
          getEventDTagId(e.tags) === getEventDTagId(event.tags),
      )
      .sortBy('created_at');

    if (replaceableRecords.length === 0) {
      console.debug('New Record Added ', event.kind, primaryKey);
      await table.add({
        ...event,
        ...{
          seen: [relayUrl],
          timestamp: Date.now(),
        },
      });
      return;
    }

    // replace with the new one and delete the outdated one
    if (event.created_at > replaceableRecords[0].created_at) {
      await table.bulkDelete(replaceableRecords.map(r => r.id));
      console.debug('Old Record Deleted ', replaceableRecords.length);

      console.debug('New Record Added ', event.kind, primaryKey);
      await table.add({
        ...event,
        ...{
          seen: [relayUrl],
          timestamp: Date.now(),
        },
      });
    }
  }

  private async save(event: Event, relayUrl: string, table: Table<DbEvent>) {
    if (Nip01.isParameterizedREplaceableEvent(event)) {
      return await this.saveParameterizedReplaceableEvent(
        event,
        relayUrl,
        table,
      );
    }

    const primaryKey =
      event.kind === WellKnownEventKind.contact_list ||
      event.kind === WellKnownEventKind.set_metadata
        ? event.pubkey
        : event.id;
    const record = await table.get(primaryKey);
    if (record) {
      if (record.seen.includes(relayUrl)) {
        return console.debug(
          'already store: ',
          event.kind,
          record.seen,
          relayUrl,
          primaryKey,
        );
      } else {
        const seen = record.seen;
        seen.push(relayUrl);
        const timestamp = Date.now();
        const updatedCount = await table.update(primaryKey, {
          seen,
          timestamp,
        });
        if (updatedCount > 0) {
          console.debug('Record updated successfully', primaryKey);
        } else {
          console.debug('Record not found or no changes made', primaryKey);
        }
      }
    } else {
      console.debug('New Record Added ', event.kind, primaryKey);
      await table.add({
        ...event,
        ...{
          seen: [relayUrl],
          timestamp: Date.now(),
        },
      });
    }
  }
}
