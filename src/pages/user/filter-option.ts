import { MsgFilter, mixKinds } from 'core/msg-filter/filter';
import { FilterOptMode } from 'core/nip/188';
import { Event } from 'core/nostr/Event';
import { WellKnownEventKind } from 'core/nostr/type';
import { stringHasImageUrl } from 'utils/common';

export const defaultProfilePageMsgFilters: MsgFilter[] = [
  {
    key: 'user-mix-notes',
    label: 'All',
    filter: {
      limit: 50,
      kinds: mixKinds,
    },
    isValidEvent: (event: Event) => {
      return mixKinds.includes(event.kind);
    },
    mode: FilterOptMode.visitingUser,
    description: "all user's mixed posts",
  },
  {
    key: 'user-long-form',
    label: 'Long-Form',
    filter: {
      limit: 50,
      kinds: [WellKnownEventKind.long_form],
    },
    isValidEvent: (event: Event) => {
      return event.kind === WellKnownEventKind.long_form;
    },
    mode: FilterOptMode.visitingUser,
    description: "all user's long-form posts",
  },
  {
    key: 'user-media',
    label: 'Media',
    filter: {
      limit: 50,
      kinds: [WellKnownEventKind.text_note],
    },
    isValidEvent: (event: Event) => {
      return (
        event.kind === WellKnownEventKind.text_note &&
        stringHasImageUrl(event.content)
      );
    },
    mode: FilterOptMode.visitingUser,
    description: "all user's note with at least one picture",
  },
];
