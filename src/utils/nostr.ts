import { EventId, isEventETag } from "service/api";

export const getEventIdsFromETags = (tags: any[]) => tags.filter(t => isEventETag(t)).map(t => t[1] as EventId);
