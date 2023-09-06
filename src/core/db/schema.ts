import { Event } from "core/nostr/Event";

export interface DbEvent extends Event {
  seen: string[];
  timestamp: number; // millsecs for last usage(resever for LRU)
}
