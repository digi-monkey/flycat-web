import { MsgFilter } from 'core/msg-filter/filter';
import { Nip172 } from 'core/nip/172';
import { FilterOptMode } from 'core/nip/188';
import { Event } from 'core/nostr/Event';

export const defaultCommFilterOptions: MsgFilter[] = [
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
