import { Event } from 'service/api';

export type BPEvent = Omit<Event, 'pubkey' | 'sig' | 'tags'>;
