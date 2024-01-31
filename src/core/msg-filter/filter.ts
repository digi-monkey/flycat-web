import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { FilterOptMode } from 'core/nip/188';

export const mixKinds = [
  WellKnownEventKind.text_note,
  WellKnownEventKind.article_highlight,
  WellKnownEventKind.long_form,
  WellKnownEventKind.reposts,
];

export interface MsgFilter {
  key: string;
  label: string;
  filter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  mode: FilterOptMode;
  description?: string;
  wasm?: ArrayBuffer | undefined;
  selfEvent?: Event;
}

export const defaultMsgFilters: MsgFilter[] = [
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
