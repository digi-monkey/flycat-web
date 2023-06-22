import {
  openDB,
  DBSchema,
  StoreValue,
  StoreNames,
  IDBPObjectStore,
  IDBPDatabase,
  IDBPTransaction,
} from 'idb';

export type DatabaseUpgradeCallback<T> = (
  database: IDBPDatabase<T>,
  oldVersion: number,
  newVersion: number | null,
  transaction: IDBPTransaction<T, ArrayLike<StoreNames<T>>, 'versionchange'>,
  event: IDBVersionChangeEvent,
) => void;

export class Database<T> {
  private dbName: string;
  private version: number;
  private upgradeCallback?: DatabaseUpgradeCallback<T>;
  private db: IDBPDatabase<T> | null;

  constructor(
    dbName: string,
    version: number,
    upgradeCallback?: DatabaseUpgradeCallback<T>,
  ) {
    this.dbName = dbName;
    this.version = version;
    this.upgradeCallback = upgradeCallback;
    this.db = null;
  }

  async connect(): Promise<IDBPDatabase<T>> {
    this.db = await openDB<T>(this.dbName, this.version, {
      upgrade: this.upgradeCallback,
    });
    return this.db;
  }

  private async getObjectStore(
    storeName: StoreNames<T>,
    mode: 'readonly' | 'readwrite' = 'readonly',
  ): Promise<
    IDBPObjectStore<T, [StoreNames<T>], StoreNames<T>, 'readonly' | 'readwrite'>
  > {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async get(
    storeName: StoreNames<T>,
    key: any,
  ): Promise<StoreValue<T, StoreNames<T>> | undefined> {
    const store = await this.getObjectStore(storeName);
    return store.get(key);
  }

  async set(storeName: StoreNames<T>, value: StoreValue<T, StoreNames<T>>) {
    const store = await this.getObjectStore(storeName, 'readwrite');
    if (store.put) store.put(value);
  }

  async delete(storeName: StoreNames<T>, key: any) {
    const store = await this.getObjectStore(storeName, 'readwrite');
    if (store.delete) store.delete(key);
  }
}
