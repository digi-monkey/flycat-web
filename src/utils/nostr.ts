import { isEventETag } from 'service/event/util';
import { EventId } from 'service/event/type';

export const getEventIdsFromETags = (tags: any[]) => tags.filter(t => isEventETag(t)).map(t => t[1] as EventId);
