import axios from 'axios';
import { Relay, RelayAccessType } from 'service/relay/type';

export interface RelayInformation {
  name?: string;
  description?: string;
  pubkey?: string;
  contact?: string;
  supported_nips?: string[];
  software?: string;
  version?: string;
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

      // Process the relay information as needed
      console.log(relayInformation);

      return relayInformation;
    } catch (error) {
      // Handle any errors that occur during the request
      console.error('Error fetching relay information:', error);
      return null;
    }
  }

  static toRelay(url: string, info: RelayInformation): Relay {
    return {
			accessType: RelayAccessType.Public,
			read: true,
      write: true,
      url,
			isOnline: true,
      operator: info.pubkey,
      about: info.description,
      contact: info.contact,
      supportedNips: info.supported_nips?.map(s => parseInt(s)),
      software: info.software,
      version: info.version,
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
            const relay = this.toRelay(url, info);
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
}
