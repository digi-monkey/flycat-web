import { schnorrVerify } from 'core/crypto';
import {
  EventId,
  PublicKey,
  EventKind,
  Tags,
  Signature,
} from 'core/nostr/type';

export interface Event {
  id: EventId;
  pubkey: PublicKey;
  created_at: number; // unix timestamp in seconds,
  kind: EventKind;
  tags: Tags;
  content: string;
  sig: Signature;
}

export class EventClass {
  event: Event;

  constructor(event: Event) {
    this.event = event;
  }

  async verifySignature(): Promise<boolean> {
    return await schnorrVerify(
      this.event.id,
      this.event.pubkey,
      this.event.sig,
    );
  }
}
