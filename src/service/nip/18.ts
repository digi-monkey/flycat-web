import { Event, EventTags, RawEvent, WellKnownEventKind } from 'service/api';

export class Nip18 {
  public static kind = WellKnownEventKind.reposts;

  static createRepost(target: Event, relay: string): RawEvent {
    const tags = [
      [EventTags.E, target.id, relay],
      [EventTags.P, target.pubkey],
    ];
    const content = JSON.stringify(target);
    const event = new RawEvent('', this.kind, tags, content);
    return event;
  }

  static parseRepostTarget(reposts: Event): Event | null {
    if (reposts.content.length > 0) {
      return JSON.parse(reposts.content) as Event;
    }
    return null;
  }
}
