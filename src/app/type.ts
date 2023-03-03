import { Event } from '../service/api';

export type EventWithSeen = Event & { seen?: string[] };
