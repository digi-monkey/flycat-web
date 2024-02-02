import { Event } from 'core/nostr/Event';

export function createRuntime(e: Event) {
  function selfEvent() {
    return e;
  }

  window.selfEvent = selfEvent;
}
