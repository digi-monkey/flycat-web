import { PublicKey } from 'service/api';

export enum RelayAccessType {
  Public = 'Public',
  Pay = 'Pay',
  Private = 'Private',
}

export interface Relay {
  read: boolean;
  write: boolean;
  url: string;
  accessType?: RelayAccessType;
  operator?: PublicKey;
  about?: string;
  contact?: string;
  supportedNips?: number[];
  software?: string;
  version?: string;
  area?: string;
  isOnline?: boolean;
  benchmark?: number; // delay in milliseconds
  lastBenchmarkTimestamp?: number;
}
