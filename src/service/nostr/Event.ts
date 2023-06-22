import { EventId, PublicKey, EventKind, Tags, Signature } from 'service/nostr/type';

export interface Event {
  id: EventId;
  pubkey: PublicKey;
  created_at: number; // unix timestamp in seconds,
  kind: EventKind;
  tags: Tags;
  content: string;
  sig: Signature;
}
