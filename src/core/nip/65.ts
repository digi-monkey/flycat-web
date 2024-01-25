import {
  EventRTag,
  EventTags,
  Filter,
  PublicKey,
  Tags,
  WellKnownEventKind,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { Relay } from 'core/relay/type';
import { RawEvent } from 'core/nostr/RawEvent';

export class Nip65 {
  public static kind = WellKnownEventKind.relay_list;

  public static toRelays(event: Event) {
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

        const relay: Relay = {
          url,
          read: readOrWrite === 'read',
          write: readOrWrite === 'write',
        };
        return relay;
      })
      .filter(r => r != null) as Relay[];

    return relays;
  }

  public static createFilter(pubkeys: PublicKey[], limit?: number) {
    const filter: Filter = {
      authors: pubkeys,
      kinds: [this.kind],
      limit,
    };
    return filter;
  }

  public static createRelayListEvent(relays: Relay[]) {
    const tags: Tags = relays.map(r => {
      const readOrWrite = r.read && r.write ? '' : r.read ? 'read' : 'write';
      if (readOrWrite === '') {
        return [EventTags.R, r.url];
      }
      return [EventTags.R, r.url, readOrWrite];
    });

    const rawEvent = new RawEvent('', WellKnownEventKind.relay_list, tags, '');
    return rawEvent;
  }
}
