import { PublicKey } from 'service/event/type';
import { PubkeyRelay } from "./pubkey-relay";

// todo: maybe store it in the real database instead of memory
export class PubkeyRelayDatabase {
  private data: Map<string, PubkeyRelay>;

  constructor() {
    this.data = new Map<string, PubkeyRelay>();
  }

  public add(pubkeyRelay: PubkeyRelay): void {
    const key = this.getKey(pubkeyRelay.pubkey, pubkeyRelay.relay);
    if (!this.data.has(key)) {
      this.data.set(key, pubkeyRelay);
    }
  }

  public get(pubkey: PublicKey, relay: string): PubkeyRelay | undefined {
    const key = this.getKey(
      pubkey,
      relay,
    );
    return this.data.get(key);
  }

  public pick(pubkey: PublicKey){
		const keyStr = Array.from(this.data.keys());
    const keys = keyStr.filter(key => key.includes(pubkey));
		return keys.map(k => this.data.get(k)!).sort((a,b)=>b.score - a.score);
  }

  private getKey(pubkey: PublicKey, relay: string): string {
    return `${pubkey}-${relay}`;
  }
}
