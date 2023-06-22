import { PublicKey } from 'service/event/type';

export interface PubkeyRelay {
  pubkey: PublicKey;
  relay: string;
  last_kind_3: number; // contact-list timestamp
  last_kind_0: number; // metadata timestamp
  last_kind_1: number; // short-note timestamp
  last_kind_30023: number; // long-form timestamp
  score: number;
}
