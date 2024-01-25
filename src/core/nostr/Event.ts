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

// todo maybe build a event class later

export async function verifyEventSignature(event: Event): Promise<boolean> {
  return await schnorrVerify(event.id, event.pubkey, event.sig);
}
