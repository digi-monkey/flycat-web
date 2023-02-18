import { Nip04 } from './04';
import { Event } from '../api';

export interface RelayPolicy {
  read: boolean;
  write: boolean;
}

export interface Nip06Relays {
  [url: string]: RelayPolicy;
}

export interface Nip06 {
  getPublicKey(): Promise<string>; // returns your public key as hex
  signEvent(event): Promise<Event>; // returns the full event object signed
  getRelays(): Promise<Nip06Relays>; // returns a map of relays
  nip04: Nip04;
}
