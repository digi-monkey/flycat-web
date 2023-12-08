import { DexieDb } from './dexie';
import { ContactQuery, ProfileQuery, Query } from './query';

export const dexieDb = new DexieDb();

export const dbEventTable = dexieDb.event;
export const dbProfileTable = dexieDb.profileEvent;
export const dbContactTable = dexieDb.contactEvent;

export const dbQuery = new Query(dbEventTable);
export const contactQuery = new ContactQuery(dexieDb.contactEvent);
export const profileQuery = new ProfileQuery(dexieDb.profileEvent);
