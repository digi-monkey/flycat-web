import Dexie, { Transaction } from 'dexie';
import { DexieDb } from './dexie';
import { ContactQuery, ProfileQuery, Query } from './query';

export const dexieDb = new DexieDb();

export const dbEventTable = dexieDb.event;
export const dbProfileTable = dexieDb.profileEvent;
export const dbContactTable = dexieDb.contactEvent;

export const dbQuery = new Query(dbEventTable);
export const contactQuery = new ContactQuery(dexieDb.contactEvent);
export const profileQuery = new ProfileQuery(dexieDb.profileEvent);

export function cancelableQuery(
  includedTables: string,
  queryFn: () => Promise<any>,
) {
  let tx: Transaction | null = null;
  let cancelled = false;
  const queryPromise = dexieDb.transaction('r', includedTables, () => {
    if (cancelled) throw new Dexie.AbortError('Query was cancelled');
    tx = Dexie.currentTransaction;
    return queryFn();
  });
  const cancel = () => {
    cancelled = true; // In case transaction hasn't been started yet.
    if (tx) tx.abort(); // If started, abort it.
    tx = null; // Avoid calling abort twice.
  };
  return {
    queryPromise,
    cancel,
  };
}
