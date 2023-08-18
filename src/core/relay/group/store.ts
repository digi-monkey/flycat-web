import { RelayGroupMap } from './type';

export interface RelayGroupStore {
	author: string;
  save: (groups: RelayGroupMap) => any;
  load: () =>  Promise<RelayGroupMap | null> | (RelayGroupMap | null);
}

export interface StoreAdapter {
	get(key: string): string | null;
	set(key: string, val: string): any;
	del(key: string): any;
}

export class LocalStorageAdapter implements StoreAdapter {
	get(key: string){
		return localStorage.getItem(key);
	}

	set(key: string, val: string){
		localStorage.setItem(key, val);
	}

	del(key: string){
		localStorage.removeItem(key);
	}
}

export class RelayGroupStorage implements RelayGroupStore {
	prefix = "__relayGroup:db";
	author: string;

	private storeAdapter: StoreAdapter;

  constructor(author: string, storeAdapter?: StoreAdapter) {
		this.author = author;
		this.storeAdapter = storeAdapter || new LocalStorageAdapter();
	}

	storeKey(){
		return `${this.prefix}:${this.author}`;
	}

  save(groups: RelayGroupMap) {
		console.log(groups, JSON.stringify(groups));
    const data = JSON.stringify(Array.from(groups));
    const key = this.storeKey();
    this.storeAdapter.set(key, data);
  }

	load(){
		const key = this.storeKey();
		const strData = this.storeAdapter.get(key);
		if(strData == null){
			return null;
		}

		const jsonData = JSON.parse(strData);
		const data: RelayGroupMap = new Map(jsonData);
		return data;
	}

	clean(){
		const key = this.storeKey();
		const strData = this.storeAdapter.get(key);
		if(strData == null){
			return;
		}

		this.storeAdapter.del(key);
	}
}
