import { Event } from 'core/nostr/Event';

export class Nip01 {
  static isReplaceableEvent(e: Event) {
    return (10000 <= e.kind && e.kind < 20000) || e.kind == 0 || e.kind == 3;
  }
  static isParameterizedREplaceableEvent(e: Event) {
    return 30000 <= e.kind && e.kind < 40000;
  }
}
