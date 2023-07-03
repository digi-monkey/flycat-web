import {
  EventRTag,
  EventTags,
  Filter,
  PublicKey,
  WellKnownEventKind,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { Relay } from 'core/relay/type';

export class Nip65 {
  static kind = WellKnownEventKind.relay_list;
  static toRelays(event: Event) {
    const tags = event.tags;
    const relays = (tags.filter(t => t[0] === EventTags.R) as EventRTag[])
      .map(t => {
        const url = t[1];
        const readOrWrite = t[2];
        if (readOrWrite == null || readOrWrite === '') {
          const relay: Relay = {
            url,
            read: true,
            write: true,
          };
          return relay;
        }

        if (readOrWrite === 'read') {
          const relay: Relay = {
            url,
            read: true,
            write: false,
          };
          return relay;
        }

        if (readOrWrite === 'write') {
          const relay: Relay = {
            url,
            read: false,
            write: true,
          };
          return relay;
        }

        console.debug(`invalid relay r tag..`, t);
        return null;
      })
      .filter(r => r != null) as Relay[];

    return relays;
  }

  static createFilter({
    pks,
    limit = 50,
  }: {
    pks: PublicKey[];
    limit?: number;
  }) {
    const filter: Filter = {
      authors: pks,
      kinds: [this.kind],
      limit,
    };
    return filter;
  }
}
