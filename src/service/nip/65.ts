import { Event, EventRTag, EventTags } from 'service/api';
import { Relay } from 'service/relay/type';

export class Nip65 {
  static toRelays(event: Event) {
    const tags = event.tags;
    const relays = (tags.filter(t => t[0] === EventTags.R) as EventRTag[]).map(
      t => {
        const url = t[1];
        const readOrWrite = t[2];
        if (readOrWrite == null) {
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

        throw new Error('invalid relay r tag');
      },
    );

    return relays;
  }
}
