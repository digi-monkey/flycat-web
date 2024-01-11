import { WellKnownEventKind, EventTags, EventId, Naddr } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { isValidEventId } from 'utils/validator';

export enum SourceType {
  event,
  article,
  url,
  unknown,
}

export interface HighlightSource {
  type: SourceType;
  data: EventId | Naddr | string;
}

export class Nip9802 {
  static kind: number = WellKnownEventKind.article_highlight;

  static isBlogHighlightMsg(event: Event): boolean {
    return (
      event.kind === this.kind &&
      event.tags.filter(
        t =>
          t[0] === EventTags.A &&
          t[1].split(':')[0] === WellKnownEventKind.long_form.toString(),
      ).length > 0
    );
  }

  static isUrlHighlightMsg(event: Event): boolean {
    return (
      event.kind === this.kind &&
      event.tags.filter(t => t[0] === EventTags.R && typeof t[1] === 'string')
        .length > 0
    );
  }

  static isEventHighlightMsg(event: Event): boolean {
    return (
      event.kind === this.kind &&
      event.tags.filter(t => t[0] === EventTags.E && isValidEventId(t[1]))
        .length > 0
    );
  }

  static isHighlightMsg(event: Event): boolean {
    return (
      this.isBlogHighlightMsg(event) ||
      this.isUrlHighlightMsg(event) ||
      this.isEventHighlightMsg(event)
    );
  }

  static getHighlightSource(event: Event) {
    if (this.isBlogHighlightMsg(event)) {
      const data = event.tags.find(
        t =>
          t[0] === EventTags.A &&
          t[1].split(':')[0] === WellKnownEventKind.long_form.toString(),
      );
      if (data) {
        const source: HighlightSource = {
          type: SourceType.article,
          data: data[1] as Naddr,
        };
        return source;
      }
      return {
        type: SourceType.unknown,
        data: 'unknown source',
      };
    }

    if (this.isEventHighlightMsg(event)) {
      const data = event.tags.find(
        t => t[0] === EventTags.E && isValidEventId(t[1]),
      );
      if (data) {
        const source: HighlightSource = {
          type: SourceType.event,
          data: data[1] as EventId,
        };
        return source;
      }
      return {
        type: SourceType.unknown,
        data: 'unknown source',
      };
    }

    if (this.isUrlHighlightMsg(event)) {
      const data = event.tags.find(
        t => t[0] === EventTags.R && typeof t[1] === 'string',
      );
      if (data) {
        const source: HighlightSource = {
          type: SourceType.url,
          data: data[1] as string,
        };
        return source;
      }
      return {
        type: SourceType.unknown,
        data: 'unknown source',
      };
    }

    return {
      type: SourceType.unknown,
      data: 'unknown source',
    };
  }

  static getHighlightContext(event: Event) {
    const t = event.tags.find(t => t[0] === 'context');
    if (t) {
      return t[1] as string;
    }
    return null;
  }
}
