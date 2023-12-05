import { EventTags, WellKnownEventKind } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { RawEvent } from 'core/nostr/RawEvent';
import { OneTimeWebSocketClient } from 'core/api/onetime';
import { EventWithSeen } from 'pages/type';
import { toSeenEvent } from 'core/nostr/util';
import { isValidJSONStr } from 'utils/validator';

export class Nip18 {
  public static kind = WellKnownEventKind.reposts;

  static createRepost(target: Event, relay: string): RawEvent {
    // todo: distinct the difference on long-form article
    // since it should use the d tags
    const tags = [
      [EventTags.E, target.id, relay],
      [EventTags.P, target.pubkey],
    ];
    const content = JSON.stringify(target);
    const event = new RawEvent('', this.kind, tags, content);
    return event;
  }

  static getTargetEventIdRelay(reposts: Event) {
    const eTag: string[] = reposts.tags.filter(t => t[0] === EventTags.E)[0];
    const targetEventId = eTag[1];
    const relay = eTag[2] as string | null; // some data are broken protocol
    return { id: targetEventId, relay };
  }

  static async getRepostTargetEvent(
    reposts: Event,
    fallbackRelays?: string[],
  ): Promise<EventWithSeen | null> {
    const eTag: string[] = reposts.tags.filter(t => t[0] === EventTags.E)[0];
    const targetEventId = eTag[1];
    const relay = eTag[2];

    if (reposts.content.length > 0) {
      if (isValidJSONStr(reposts.content)) {
        return toSeenEvent(JSON.parse(reposts.content) as Event, [relay]);
      }

      console.debug(`invalid event json string`, reposts.content);
    }

    // some bad event have no relay even if it is required
    if (relay == null || relay === '') {
      console.error(
        `bad repost event: relay missing from e tag. event id: ${reposts.id}`,
      );
    }
    
    let event: Event | null = null;
    if(relay !== '' && relay != null){
      event = await OneTimeWebSocketClient.fetchEvent({
        eventId: targetEventId,
        relays: [relay],
      });
      if (event != null) {
        return toSeenEvent(event, [relay]);
      }
    }

    /*
    if (event == null && fallbackRelays) {
      event = await OneTimeWebSocketClient.fetchEvent({
        eventId: targetEventId,
        relays: fallbackRelays,
      });
      return event ? toSeenEvent(event, fallbackRelays) : null;
    }
    */

    return null;
  }

  static isRepostEvent(repost: Event) {
    return repost.kind === this.kind;
  }
}
