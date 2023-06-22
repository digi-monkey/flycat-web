import { Event } from 'core/nostr/Event';

export type EventWithSeen = Event & { seen?: string[] };
