import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { FilterOptMode } from 'core/nip/188';
import { stringHasImageUrl } from 'utils/common';
import { Nip172 } from 'core/nip/172';

export const mixKinds = [
  WellKnownEventKind.text_note,
  WellKnownEventKind.article_highlight,
  WellKnownEventKind.long_form,
  WellKnownEventKind.reposts,
];

export interface TimelineFilterOption {
  key: string;
  label: string;
  filter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  mode: FilterOptMode;
  description?: string;
  wasm?: ArrayBuffer | undefined;
  selfEvent?: Event;
}

export const defaultHomeTimelineFilters: TimelineFilterOption[] = [
  {
    key: 'Follow',
    label: 'Follow',
    filter: {
      limit: 50,
      kinds: mixKinds,
    },
    isValidEvent: (event: Event) => {
      return mixKinds.includes(event.kind);
    },
    mode: FilterOptMode.follow,
    description: "all your followings's mixed posts",
  },
  {
    key: 'Global-All',
    label: 'Global',
    filter: {
      limit: 50,
      kinds: mixKinds,
    },
    isValidEvent: (event: Event) => {
      return mixKinds.includes(event.kind);
    },
    mode: FilterOptMode.global,
    description: "all the realtime global's mixed posts",
  },
];

export const defaultProfileTimelineFilters: TimelineFilterOption[] = [
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

export const defaultCommTimelineFilters: TimelineFilterOption[] = [
  {
    key: 'all-tribes',
    label: 'All Tribes',
    filter: {
      kinds: [Nip172.approval_kind],
      limit: 50,
    },
    isValidEvent: (event: Event) => {
      return event.kind === Nip172.approval_kind;
    },
    mode: FilterOptMode.custom,
    description: "All Tribes's mixed posts",
  },
  {
    key: 'following-tribes',
    label: 'Following',
    filter: {
      kinds: [Nip172.approval_kind],
      limit: 50,
    },
    isValidEvent: (event: Event) => {
      return event.kind === Nip172.approval_kind;
    },
    mode: FilterOptMode.custom,
    description: "all your following tribe's mixed posts",
  },
];
