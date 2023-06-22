import { Nip06 } from 'core/nip/06';
import { WebLNProvider } from '@webbtc/webln-types';

declare global {
  interface Window {
    nostr?: Nip06;
    webln?: WebLNProvider;
    ethereum?: any;
    twttr?: any;
  }
}
