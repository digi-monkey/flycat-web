import axios from 'axios';
import { EventSetMetadataContent } from 'service/api';
import { Relay, RelayAccessType } from 'service/relay/type';
import { OneTimeWebSocketClient } from 'service/websocket/onetime';

export interface RelayLimitation {
  max_message_length?: number;
  max_subscriptions?: number;
  max_filters?: number;
  max_limit?: number;
  max_subid_length?: number;
  min_prefix?: number;
  max_event_tags?: number;
  max_content_length?: number;
  min_pow_difficulty?: number;
  auth_required?: boolean;
  payment_required?: boolean;
}

export type RelayKindItem = number | [number, number];
export interface RelayRetention {
  kinds?: RelayKindItem[];
  time?: number | null; // null indicating infinity. If zero is provided, this means the event will not be stored at all
  count?: number;
}

export type RelayCountries = string[]; // a list of two-level ISO country codes (ISO 3166-1 alpha-2) for laws and policies

export type RelayLanguageTags = string[]; // an ordered list of IETF language tags
export type RelayTags = string[];
export type RelayPostingPolicy = string; // human-readable html url

export interface RelayFeeItem {
  amount?: number;
  unit?: 'msats' | 'sats';
  period?: number;
  kinds?: RelayKindItem[];
}

export interface RelayFees {
  admission?: RelayFeeItem[];
  subscription?: RelayFeeItem[];
  publication?: RelayFeeItem[];
}

export interface RelayInformation {
  name?: string;
  description?: string;
  pubkey?: string;
  contact?: string;
  supported_nips?: string[];
  software?: string;
  version?: string;

  // extra filed
  limitation?: RelayLimitation;
  retention?: RelayRetention;
  relay_countries?: RelayCountries;
  language_tags?: RelayLanguageTags;
  tags?: RelayTags;
  posting_policy?: RelayPostingPolicy;
  payments_url?: string;
  fees?: RelayFeeItem[];
  icon?: string;
}

export class Nip11 {
  static async getRelayInformation(url: string) {
    try {
      const httpUrl = url
        .replace(/^wss?:\/\//, 'https://')
        .replace(/^ws?:\/\//, 'http://');

      const response = await axios.get<RelayInformation>(httpUrl, {
        headers: {
          Accept: 'application/nostr+json',
        },
      });

      // Access the relay information from the response data
      const relayInformation: RelayInformation = response.data;

      return relayInformation;
    } catch (error) {
      // Handle any errors that occur during the request
      console.error('Error fetching relay information:', error);
      return null;
    }
  }

  static async getRelayOperatorDetail(url: string, operator: string) {
    return await OneTimeWebSocketClient.fetchProfile({
      pubkey: operator,
      relays: [url],
    });
  }

  static toUpdateRelay(relay: Relay, info: RelayInformation, operatorDetail?: EventSetMetadataContent): Relay {
    const payRequired = info.limitation?.payment_required;
    const accessType = payRequired === true ? RelayAccessType.Pay : RelayAccessType.Public; 
    return {
      accessType: accessType,
      read: relay.read,
      write: relay.write,
      url: relay.url,
      isOnline: true,
      operator: info.pubkey,
      operatorDetail,
      supportedNips: info.supported_nips?.map(s => parseInt(s)),
      software: info.software,
      version: info.version,
      retention: info.retention,
      relayCountries: info.relay_countries,
      languageTags: info.language_tags,
      tags: info.tags,
      about: info.description,
      contact: info.contact,
      postingPolicy: info.posting_policy,
      paymentsUrl: info.payments_url,
      fees: info.fees,
      icon: info.icon,

      lastAttemptNip11Timestamp: Date.now(),

      successCount: relay.successCount || 0,
      failureCount: relay.failureCount || 0,

      // todo: area
    };
  }

  static toRelay(url: string, info: RelayInformation, operatorDetail?: EventSetMetadataContent): Relay {
    const payRequired = info.limitation?.payment_required;
    const accessType = payRequired === true ? RelayAccessType.Pay : RelayAccessType.Public; 
    return {
      accessType: accessType,
      read: true,
      write: true,
      url,
      isOnline: true,
      operator: info.pubkey,
      operatorDetail,
      supportedNips: info.supported_nips?.map(s => parseInt(s)),
      software: info.software,
      version: info.version,
      retention: info.retention,
      relayCountries: info.relay_countries,
      languageTags: info.language_tags,
      tags: info.tags,
      about: info.description,
      contact: info.contact,
      postingPolicy: info.posting_policy,
      paymentsUrl: info.payments_url,
      fees: info.fees,
      icon: info.icon,

      lastAttemptNip11Timestamp: Date.now(),

      successCount: 0,
      failureCount: 0,

      // todo: area
    };
  }

  static async getRelays(urls: string[]) {
    const promises = urls.map(
      url =>
        new Promise(async (resolve: (res: Relay | null) => any) => {
          try {
            const info = await this.getRelayInformation(url);
            if (!info) return resolve(null);
            let operatorDetail: EventSetMetadataContent | undefined; 
            if(info.pubkey){
              const event = await this.getRelayOperatorDetail(url, info.pubkey);
              if(event){
                operatorDetail = event;
              }
            }
            
            const relay = this.toRelay(url, info, operatorDetail);
            resolve(relay);
          } catch (error) {
            console.debug(error);
            resolve(null);
          }
        }),
    );
    const results = await Promise.all(promises);
    return results.filter(r => r != null) as Relay[];
  }

  static async updateRelays(relays: Relay[]) {
    const promises = relays.map(
      relay => {
        const url = relay.url;
        return new Promise(async (resolve: (res: Relay | null) => any) => {
          try {
            const info = await this.getRelayInformation(url);
            if (!info) return resolve(null);
            let operatorDetail: EventSetMetadataContent | undefined; 
            if(info.pubkey){
              const event = await this.getRelayOperatorDetail(url, info.pubkey);
              if(event){
                operatorDetail = event;
              }
            }
            
            const newRelay = this.toUpdateRelay(relay, info, operatorDetail);
            resolve(newRelay);
          } catch (error) {
            console.debug(error);
            resolve(null);
          }
        });
      }
    );
    const results = await Promise.all(promises);
    return results.filter(r => r != null) as Relay[];
  }
}
