import { Filter } from 'core/nostr/type';

export function validateFilter(filter: Filter) {
  for (const value of Object.values(filter)) {
    if (Array.isArray(value) && value.length === 0) return false;
  }

  return true;
}
