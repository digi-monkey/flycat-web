// specs https://github.com/nostr-protocol/nips/pull/602

import {
  EventATag,
  EventId,
  EventTags,
  Filter,
  Naddr,
  PublicKey,
  WellKnownEventKind,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { isEvent } from 'core/nostr/util';

export interface CommunityMetadata {
  creator: PublicKey;
  moderators: PublicKey[];
  id: string; // also is the Community name
  description: string;
  image: string;
}

export class Nip172 {
  static metadata_kind = WellKnownEventKind.community_metadata;
  static approval_kind = WellKnownEventKind.community_approval;

  static communitiesFilter(pks?: PublicKey[]): Filter {
    const filter: Filter = {
      kinds: [this.metadata_kind],
    };
    if (pks && pks.length > 0) {
      filter.authors = pks;
    }

    return filter;
  }

  static communityByPkAndIdFilter(identifier: string, author: PublicKey) {
    const filter: Filter = {
      kinds: [this.metadata_kind],
      '#d': [identifier],
      authors: [author],
      limit: 1,
    };
    return filter;
  }

  static communityAddr({
    identifier,
    author,
  }: {
    identifier: string;
    author: PublicKey;
  }) {
    return `${this.metadata_kind}:${author}:${identifier}`;
  }

  static communityATag({
    identifier,
    author,
    relay,
  }: {
    identifier: string;
    author: PublicKey;
    relay?: string;
  }) {
    return [
      EventTags.A,
      this.communityAddr({ identifier, author }),
      relay ? relay : '',
    ] as EventATag;
  }

  // get the approvaling on events
  static approvalFilter({
    identifier,
    author,
    moderators,
  }: {
    identifier: string;
    author: PublicKey;
    moderators: PublicKey[];
  }) {
    const addr = this.communityAddr({ identifier, author });
    const filter: Filter = {
      authors: [author, ...moderators],
      kinds: [this.approval_kind],
      '#a': [addr],
    };
    return filter;
  }

  // query approval for specific event id
  static approvalForEventFilter({
    identifier,
    author,
    moderators,
    eventIds,
  }: {
    identifier: string;
    author: PublicKey;
    moderators: PublicKey[];
    eventIds: EventId[];
  }) {
    const addr = this.communityAddr({ identifier, author });
    const filter: Filter = {
      authors: [author, ...moderators],
      kinds: [this.approval_kind],
      '#a': [addr],
      '#e': eventIds,
    };
    return filter;
  }

  // get all the approval posts
  // todo: this only handles single post in approval
  static approvalPostFilter({ approvalEvent }: { approvalEvent: Event }) {
    const postKind = +approvalEvent.tags
      .filter(t => t[0] === EventTags.K)
      .map(t => t[1] as string)[0];

    const postAuthor = approvalEvent.tags
      .filter(t => t[0] === EventTags.P)
      .map(t => t[1] as PublicKey)[0];

    const postEventId = approvalEvent.tags
      .filter(t => t[0] === EventTags.E)
      .map(t => t[1] as EventId)[0];

    const postATags = approvalEvent.tags.filter(
      t => !this.isCommunityATag(t),
    ) as EventATag[];

    const filter: Filter = {
      kinds: [postKind],
      authors: [postAuthor],
    };

    if (postKind === WellKnownEventKind.text_note) {
      if (postEventId == null)
        throw new Error('post event id not found when K is 1');
      filter['#e'] = [postEventId];
      return filter;
    }

    if (postKind === WellKnownEventKind.long_form) {
      // todo:
      filter['#d'] = postATags.map(t => t[1]);
    }

    return filter;
  }

  static allPostsFilter({
    identifier,
    author,
  }: {
    identifier: string;
    author: PublicKey;
  }) {
    const addr = this.communityAddr({ identifier, author });
    const filter: Filter = {
      kinds: [WellKnownEventKind.text_note, WellKnownEventKind.long_form],
      '#a': [addr],
    };
    return filter;
  }

  static isCommunityATag(t: any[]): boolean {
    return (
      t[0] === EventTags.A &&
      t[1].split(':')[0] === this.metadata_kind.toString()
    );
  }

  static isCommunityPost(event: Event): boolean {
    return event.tags.filter(t => this.isCommunityATag(t)).length > 0;
  }

  static getCommunityAddr(event: Event) {
    if (!this.isCommunityPost(event))
      throw new Error('not a valid community post');

    const aTags = event.tags.filter(t => this.isCommunityATag(t));
    if (aTags.length === 0){
			throw new Error('not a valid community post: a tag not found');
		}

    return aTags.map(t => t[1] as Naddr)[0] as Naddr;
  }

  static parseCommunityAddr(addr: Naddr) {
    const author = addr.split(':')[1];
    const identifier = addr.split(':')[2];
    return { identifier, author };
  }

  static parseCommunityMetadata(event: Event) {
    if (event.kind !== this.metadata_kind)
      throw new Error('invalid community metadata kind');

    const id = event.tags
      .filter(t => t[0] === EventTags.D)
      .map(t => t[1] as string)[0];
    const image = event.tags
      .filter(t => t[0] === 'image')
      .map(t => t[1] as string)[0];
    const description = event.tags
      .filter(t => t[0] === 'description')
      .map(t => t[1] as string)[0];
    const creator = event.pubkey;
    const moderators = event.tags
      .filter(t => t[0] === EventTags.P)
      .map(t => t[1] as PublicKey);

    const metadata: CommunityMetadata = {
      id,
      image,
      description,
      creator,
      moderators,
    };

    return metadata;
  }

  static shortNoteIdsFromApprovals({
    approvalEvents,
  }: {
    approvalEvents: Event[];
  }) {
    const ids: EventId[] = [];
    for (const approvalEvent of approvalEvents) {
      const postKind = +approvalEvent.tags
        .filter(t => t[0] === EventTags.K)
        .map(t => t[1] as string)[0];

      const postAuthor = approvalEvent.tags
        .filter(t => t[0] === EventTags.P)
        .map(t => t[1] as PublicKey)[0];

      const postEventId = approvalEvent.tags
        .filter(t => t[0] === EventTags.E)
        .map(t => t[1] as EventId)[0];

      const postATags = approvalEvent.tags.filter(
        t => !this.isCommunityATag(t),
      ) as EventATag[];

      if (postKind === WellKnownEventKind.text_note) {
        if (!ids.includes(postEventId)) {
          ids.push(postEventId);
        }
      }
    }

    return ids;
  }

  static shortNoteIdFromApproval({ approvalEvent }: { approvalEvent: Event }) {
    const postKind = +approvalEvent.tags
      .filter(t => t[0] === EventTags.K)
      .map(t => t[1] as string)[0];

    const postEventId = approvalEvent.tags
      .filter(t => t[0] === EventTags.E)
      .map(t => t[1] as EventId)[0];

    const postATags = approvalEvent.tags.filter(
      t => !this.isCommunityATag(t),
    ) as EventATag[];

    if (postKind === WellKnownEventKind.text_note) {
      return postEventId;
    }

    return null;
  }

  static parseNoteFromApproval(approvalEvent: Event) {
    if (approvalEvent.content.length === 0) {
      return null;
    }

    try {
      const note: Event = JSON.parse(approvalEvent.content);
      if (isEvent(note)) {
        return note;
      }
    } catch (error: any) {
      console.debug(error.message);
    }

    return null;
  }
}
