import { EventId, Filter, WellKnownEventKind } from 'core/nostr/type';

export class Nip45 {
  static createReplyCountFilter(eventId: EventId): Filter {
    return {
      '#e': [eventId],
      kinds: [WellKnownEventKind.text_note],
    };
  }

  static createZapCountFilter(eventId: EventId): Filter {
    // todo
    return {};
  }
}
