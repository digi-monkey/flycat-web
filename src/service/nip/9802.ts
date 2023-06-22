import { WellKnownEventKind, EventTags } from 'service/event/type';
import { Event } from 'service/event/Event';

export class Nip9802 {
	static kind: number = WellKnownEventKind.article_highlight;

  static isBlogHighlightMsg(event: Event): boolean {
    return (
      event.kind === this.kind &&
      event.tags.filter(
        t =>
          t[0] === EventTags.A && t[1].split(':')[0] === WellKnownEventKind.long_form.toString(),
      ).length > 0
    );
  }
}
