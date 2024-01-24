import { WellKnownEventKind } from 'core/nostr/type';
import { Relay } from '../type';

export interface RelayGroup {
  id: string;
  title: string;
  description?: string;
  relays: Relay[];
  timestamp: number;
  kind?: WellKnownEventKind;
  changed?: boolean;
}

export type RelayGroupMap = Map<string, RelayGroup>;
