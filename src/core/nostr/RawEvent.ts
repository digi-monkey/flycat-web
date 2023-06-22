import {
  getPublicKey,
  schnorrSign,
  Sha256
} from '../crypto';
import { EventId, PublicKey, EventKind, Tags, PrivateKey, Signature } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';

export interface RawEvent {
  id?: EventId;
  pubkey: PublicKey;
  created_at: number; // unix timestamp in seconds,
  kind: EventKind;
  tags: Tags;
  content: string;
}

export class RawEvent implements RawEvent {
  public id?: EventId;
  public pubkey: PublicKey;
  public created_at: number; // unix timestamp in seconds,
  public kind: EventKind;
  public tags: Tags;
  public content: string;

  constructor(
    pubkey: PublicKey,
    kind: EventKind,
    tags?: Tags,
    content?: string,
    created_at?: number
  ) {
    this.pubkey = pubkey;
    this.kind = kind;
    this.tags = tags ?? [];
    this.content = content ?? '';
    this.created_at = created_at ?? Math.round(Date.now() / 1000);
  }

  sha256() {
    const data = this.serialize();
    return Sha256(data);
  }

  serialize() {
    const data = [
      0,
      this.pubkey.toLowerCase(),
      this.created_at,
      this.kind,
      this.tags,
      this.content, // <content, as a string>
    ];
    return JSON.stringify(data);
  }

  async sign(privateKey: PrivateKey): Promise<Signature> {
    if (this.pubkey == null || this.pubkey.length === 0) {
      this.pubkey = getPublicKey(privateKey);
    }
    const hash = this.sha256();
    return await schnorrSign(hash, privateKey);
  }

  async toEvent(privateKey: PrivateKey): Promise<Event> {
    const sig = await this.sign(privateKey);
    const id = this.sha256();
    const event: Event = {
      id,
      pubkey: this.pubkey,
      kind: this.kind,
      content: this.content,
      created_at: this.created_at,
      tags: this.tags,
      sig,
    };
    return event;
  }
}
