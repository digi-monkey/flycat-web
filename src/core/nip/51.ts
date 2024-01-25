import {
  EventTags,
  Filter,
  PublicKey,
  Tags,
  WellKnownEventKind,
} from 'core/nostr/type';
import { RawEvent } from 'core/nostr/RawEvent';
import { Relay } from 'core/relay/type';

interface RelaySetPayload {
  id: string;
  title: string;
  description?: string;
  relays: Relay[];
}

export class Nip51 {
  public static publicNoteBookmarkIdentifier = 'favorite';

  public static async createBookmarkList(tags: Tags, content: string) {
    const rawEvent = new RawEvent(
      '',
      WellKnownEventKind.bookmark_list,
      tags,
      content,
    );
    return rawEvent;
  }

  public static async createPublicNoteBookmarkList(eventIds: string[]) {
    // todo: distinct the long-form event id from eventIds to use "A" tag
    const identifier = this.publicNoteBookmarkIdentifier;
    const tags: Tags = eventIds.map(id => [EventTags.E, id]);
    tags.push([EventTags.D, identifier]);
    const content = '';
    return await this.createBookmarkList(tags, content);
  }

  public static createPublicBookmarkListFilter(pubkey: string): Filter {
    const identifier = this.publicNoteBookmarkIdentifier;
    const filter: Filter = {
      authors: [pubkey],
      kinds: [WellKnownEventKind.bookmark_list],
      '#d': [identifier],
      limit: 1,
    };
    return filter;
  }

  public static parseRelaySet(tags: Tags) {
    const relaySet = {
      id: '',
      title: '',
      description: '',
      relays: [] as string[],
    };
    tags.forEach(([tag, value]) => {
      switch (tag) {
        case EventTags.D:
          relaySet.id = value;
          break;
        case EventTags.Title:
          relaySet.title = value;
          break;
        case EventTags.Description:
          relaySet.description = value;
          break;
        case EventTags.Relay:
          relaySet.relays.push(value);
          break;
      }
    });
    return relaySet;
  }

  public static createRelaySetEvent({
    id,
    title,
    description,
    relays,
  }: RelaySetPayload) {
    const tags: Tags = [];
    if (!id || !title) {
      throw new Error('invalid relay set');
    }

    tags.push([EventTags.D, id]);
    tags.push([EventTags.Title, title]);
    if (description) {
      tags.push([EventTags.Description, description]);
    }
    relays?.forEach(r => tags.push(['relay', r.url]));
    const rawEvent = new RawEvent('', WellKnownEventKind.relay_set, tags, '');
    return rawEvent;
  }

  public static createRelaySetFilter(
    pubkeys: PublicKey[],
    identifier?: string,
  ): Filter {
    const filter: Filter = {
      authors: pubkeys,
      kinds: [WellKnownEventKind.relay_set],
      limit: 100,
    };
    if (identifier) {
      filter['#d'] = [identifier];
    }
    return filter;
  }
}
