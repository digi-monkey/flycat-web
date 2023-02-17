import { Event } from '../service/api';

export type TextNoteEvent = Event & { seen?: string[] };
