import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { stringHasImageUrl } from 'utils/common';
import { isChineseLang } from './util';

const mixKinds = [
  WellKnownEventKind.text_note,
  WellKnownEventKind.article_highlight,
  WellKnownEventKind.long_form,
  WellKnownEventKind.reposts,
];

export enum MsgFilterKey {
  follow = 'Follow',
  followArticle = 'Follow-Article',
  globalAll = 'Global-All',
  media = 'Media',
  zh = 'Chinese',
  foodstr = 'Foodstr',
  bitcoin = 'Bitcoin',
  meme = 'Meme',
}

export enum MsgFilterMode {
  global = 'Global',
  follow = 'Follow',
  custom = 'Custom',
}

export interface MsgFilter {
  key: MsgFilterKey | string;
  label: string;
  filter: Filter;
  isValidEvent?: (event: Event) => boolean;
  mode: MsgFilterMode;
  description?: string;
  wasm?: ArrayBuffer | undefined;
}

export const defaultMsgFilters: MsgFilter[] = [
  {
    key: MsgFilterKey.follow,
    label: 'Follow',
    filter: {
      limit: 50,
      kinds: mixKinds,
    },
    isValidEvent: (event: Event) => {
      return mixKinds.includes(event.kind);
    },
    mode: MsgFilterMode.follow,
    description: "all your followings's mixed posts",
  },
  {
    key: MsgFilterKey.followArticle,
    label: 'Follow-Article',
    filter: {
      limit: 50,
      kinds: [WellKnownEventKind.long_form],
    },
    isValidEvent: (event: Event) => {
      return event.kind === WellKnownEventKind.long_form;
    },
    mode: MsgFilterMode.follow,
    description: "all your followings's long-form posts",
  },
  {
    key: MsgFilterKey.globalAll,
    label: 'Global',
    filter: {
      limit: 50,
      kinds: mixKinds,
    },
    isValidEvent: (event: Event) => {
      return event.kind === WellKnownEventKind.long_form;
    },
    mode: MsgFilterMode.global,
    description: "all the realtime global's mixed posts",
  },
  {
    key: MsgFilterKey.media,
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
    mode: MsgFilterMode.global,
    description: 'global posts including at least one picture',
  },
  {
    key: MsgFilterKey.zh,
    label: 'Chinese',
    filter: {
      kinds: [WellKnownEventKind.text_note],
    } as Filter,
    isValidEvent: (event: Event) => {
      return (
        event.kind === WellKnownEventKind.text_note &&
        isChineseLang(event.content)
      );
    },
    mode: MsgFilterMode.global,
    description: 'global posts which language is Chinese',
  },
  {
    key: MsgFilterKey.foodstr,
    label: '#Foodstr',
    filter: {
      kinds: [WellKnownEventKind.text_note],
      '#t': ['foodstr'],
    } as Filter,
    isValidEvent: (event: Event) => {
      return event.kind === WellKnownEventKind.text_note;
    },
    mode: MsgFilterMode.global,
    description: 'global posts including #Foodstr tag',
  },
  {
    key: MsgFilterKey.meme,
    label: '#Meme',
    filter: {
      kinds: [WellKnownEventKind.text_note],
      '#t': ['meme'],
    } as Filter,
    isValidEvent: (event: Event) => {
      return event.kind === WellKnownEventKind.text_note;
    },
    mode: MsgFilterMode.global,
    description: 'global posts including #meme tag',
  },
  {
    key: MsgFilterKey.bitcoin,
    label: '#Bitcoin',
    filter: {
      kinds: [WellKnownEventKind.text_note],
      '#t': ['bitcoin'],
    } as Filter,
    isValidEvent: (event: Event) => {
      return event.kind === WellKnownEventKind.text_note;
    },
    mode: MsgFilterMode.global,
    description: 'global posts including #bitcoin tag',
  },
];

export const defaultMsgFiltersMap = defaultMsgFilters.reduce(
  (map, filter) => ({
    ...map,
    [filter.key]: filter,
  }),
  {} as Record<MsgFilterKey, MsgFilter>,
);
