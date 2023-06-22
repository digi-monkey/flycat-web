import { Event } from 'service/nostr/Event';

export type EventWithSeen = Event & { seen?: string[] };
