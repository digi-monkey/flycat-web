import { EventSetMetadataContent, PublicKey } from 'core/nostr/type';
import {
  RelayCountries,
  RelayFeeItem,
  RelayLanguageTags,
  RelayLimitation,
  RelayPostingPolicy,
  RelayRetention,
  RelayTags,
} from 'core/nip/11';

export enum RelayAccessType {
  Public = 'Public',
  Pay = 'Pay',
  Private = 'Private',
}

export interface Relay {
  url: string;
  accessType?: RelayAccessType;
  read: boolean; // note: the read here is not the same meaning with Nip-65's read
  write: boolean;

  // Nip-11 info variant
  name?: string;
  operator?: PublicKey;
  operatorDetail?: EventSetMetadataContent;
  about?: string;
  contact?: string;
  supportedNips?: number[];
  software?: string;
  version?: string;
  limitation?: RelayLimitation;
  retention?: RelayRetention;
  relayCountries?: RelayCountries;
  languageTags?: RelayLanguageTags;
  tags?: RelayTags;
  postingPolicy?: RelayPostingPolicy;
  paymentsUrl?: string;
  fees?: RelayFeeItem[];
  icon?: string;

  lastAttemptNip11Timestamp?: number; // last relay info fetching time milliseconds

  area?: string; // location based on ip
  isOnline?: boolean;

  benchmark?: number; // delay in milliseconds
  lastBenchmarkTimestamp?: number; // last benchmark time milliseconds
  lastUpdateTimestamp?: number; // last update time milliseconds

  // connection statistic
  successCount?: number;
  failureCount?: number;
}

export class RelayTracker {
  static attempts(relay: Relay) {
    const success = relay.successCount || 0;
    const failure = relay.failureCount || 0;
    return success + failure;
  }

  static success_rate(relay: Relay) {
    const attempts = RelayTracker.attempts(relay);

    if (attempts === 0) {
      return 0.5;
    } // unknown, so we put it in the middle
    return (relay.successCount || 0) / attempts;
  }

  static isOutdated(timestamp?: number, offsetDays = 7) {
    if (timestamp == null) {
      return true;
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - offsetDays); // Subtract 7 days from the current date

    const providedDate = new Date(timestamp);
    return providedDate < oneWeekAgo;
  }
}
