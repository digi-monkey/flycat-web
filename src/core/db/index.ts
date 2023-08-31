import { DexieDb } from './dexie';
import { Query } from './query';

export const dexieDb = new DexieDb();
export const dbEventTable = dexieDb.event;
export const dbQuery = new Query(dbEventTable);

