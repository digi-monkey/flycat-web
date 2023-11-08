import { initSync, is_valid_event } from "../filter-binding";
import { Event } from 'core/nostr/Event';

export const testFn = async (byteCode: ArrayBuffer) => {
  initSync(byteCode);
  const event: Event = {
    id: "aaa",
    pubkey: "bbb",
    sig: "ccc",
    content: "",
    kind: 1,
    created_at: 1000,
    tags: []
  }
  console.log("is_valid_event(event): ", is_valid_event, is_valid_event(event));
}
