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

export enum HomeMsgFilterType {
  all = 'All',
  article = 'Article',
  media = 'Media',
  flycat = 'Flycat',
  zh = 'Chinese',
  foodstr = 'Foodstr',
  nostr = 'Nostr',
  dev = 'Dev',
  bitcoin = 'Bitcoin',
  photography = 'Photography',
  art = 'Art',
  meme = 'Meme',
}

export interface HomeMsgFilter {
  type: HomeMsgFilterType;
  label: string;
  filter: Filter;
  isValidEvent?: (event: Event) => boolean;
}

export const homeMsgFilters: HomeMsgFilter[] = [
  {
    type: HomeMsgFilterType.all,
    label: 'All',
    filter: {
      limit: 50,
      kinds: mixKinds,
    },
    isValidEvent: (event: Event) => {
      return mixKinds.includes(event.kind);
    },
  },
  {
    type: HomeMsgFilterType.article,
    label: 'Article',
    filter: {
      limit: 50,
      kinds: [WellKnownEventKind.long_form],
    },
    isValidEvent: (event: Event) => {
      return event.kind === WellKnownEventKind.long_form;
    },
  },
  {
    type: HomeMsgFilterType.media,
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
  },
  {
    type: HomeMsgFilterType.zh,
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
  },
  {
    type: HomeMsgFilterType.foodstr,
    label: '#Foodstr',
    filter: {
      kinds: [WellKnownEventKind.text_note],
      '#t': ['foodstr'],
    } as Filter,
    isValidEvent: (event: Event) => {
      return event.kind === WellKnownEventKind.text_note;
    },
  },
  {
    type: HomeMsgFilterType.meme,
    label: '#Meme',
    filter: {
      kinds: [WellKnownEventKind.text_note],
      '#t': ['meme'],
    } as Filter,
    isValidEvent: (event: Event) => {
      return event.kind === WellKnownEventKind.text_note;
    },
  },
  {
    type: HomeMsgFilterType.bitcoin,
    label: '#Bitcoin',
    filter: {
      kinds: [WellKnownEventKind.text_note],
      '#t': ['bitcoin'],
    } as Filter,
    isValidEvent: (event: Event) => {
      return event.kind === WellKnownEventKind.text_note;
    },
  },
  {
    type: HomeMsgFilterType.photography,
    label: '#Photography',
    filter: {
      kinds: [WellKnownEventKind.text_note],
      '#t': ['photography'],
    } as Filter,
    isValidEvent: (event: Event) => {
      return event.kind === WellKnownEventKind.text_note;
    },
  },
  {
    type: HomeMsgFilterType.art,
    label: '#Art',
    filter: {
      kinds: [WellKnownEventKind.text_note],
      '#t': ['art'],
    } as Filter,
    isValidEvent: (event: Event) => {
      return event.kind === WellKnownEventKind.text_note;
    },
  },
  {
    type: HomeMsgFilterType.flycat,
    label: 'Flycat',
    filter: {
      kinds: [WellKnownEventKind.text_note],
    } as Filter,
    isValidEvent: (event: Event) => {
      return (
        event.kind === WellKnownEventKind.text_note &&
        event.content.includes('flycat')
      );
    },
  },
];

