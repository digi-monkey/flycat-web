import { Event } from 'service/event/Event';

export type EventWithSeen = Event & { seen?: string[] };
