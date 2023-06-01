import { Event, EventTags, RawEvent, WellKnownEventKind } from 'service/api';
import { OneTimeWebSocketClient } from 'service/websocket/onetime';

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

  static async getRepostTargetEvent(reposts: Event, fallbackRelays?: string[]): Promise<Event | null> {
    if (reposts.content.length > 0) {
      return JSON.parse(reposts.content) as Event;
    }

		const eTag: string[] = reposts.tags.filter(t => t[0] === EventTags.E)[0];
		const targetEventId = eTag[1];
		const relay = eTag[2];
		
		let event = await OneTimeWebSocketClient.fetchEvent({eventId: targetEventId, relays: [relay]});
		if(event == null && fallbackRelays){
			event = await OneTimeWebSocketClient.fetchEvent({eventId: targetEventId, relays: fallbackRelays});
		}
    return event;
  }
}

