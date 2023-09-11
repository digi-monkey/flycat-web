import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { stringHasImageUrl } from 'utils/common';

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
      limit: 50,
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
      limit: 50,
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
      limit: 50,
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
      limit: 50,
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
      limit: 50,
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
      limit: 50,
    } as Filter,
    isValidEvent: (event: Event) => {
      return (
        event.kind === WellKnownEventKind.text_note &&
        event.content.includes('flycat')
      );
    },
  },
];

export function isChineseLang(text: string) {
  // Count the number of Kanji, Hiragana, and Katakana characters in the text
  const kanjiCount = (text.match(/[\u4e00-\u9faf]/g) || []).length;
  const hiraganaCount = (text.match(/[\u3040-\u309f]/g) || []).length;
  const katakanaCount = (text.match(/[\u30a0-\u30ff]/g) || []).length;

  // Check if the text has more Kanji, Hiragana, or Katakana characters
  if (kanjiCount > hiraganaCount && kanjiCount > katakanaCount) {
    return true; //"Chinese";
  } else if (hiraganaCount > kanjiCount && hiraganaCount > katakanaCount) {
    return false; //"Japanese (Hiragana)";
  } else if (katakanaCount > kanjiCount && katakanaCount > hiraganaCount) {
    return false; //"Japanese (Katakana)";
  } else {
    return false; //"Uncertain";
  }
}
