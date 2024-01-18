import { Relay } from '../type';

export interface RelayGroup {
  id: string;
  title: string;
  description?: string;
  relays: Relay[];
}

export type RelayGroupMap = Map<string, RelayGroup>;
