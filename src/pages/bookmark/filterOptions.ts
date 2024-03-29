import { WellKnownEventKind } from 'core/nostr/type';

export const FilterOptions = [
  {
    name: 'all',
    value: 'All',
    kinds: [WellKnownEventKind.text_note, WellKnownEventKind.long_form],
  },
  {
    name: 'short-only',
    value: 'Short Notes Only',
    kinds: [WellKnownEventKind.text_note],
  },
  {
    name: 'long-form-only',
    value: 'Long-Form Only',
    kinds: [WellKnownEventKind.long_form],
  },
];
