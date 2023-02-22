import { Nip06 } from 'service/nip/06';
import { WebLNProvider } from '@webbtc/webln-types';
import { LightningPayReq } from 'service/lighting/bolt11-type';

declare global {
  interface Window {
    nostr?: Nip06;
    webln?: WebLNProvider;
  }
}

export {};
