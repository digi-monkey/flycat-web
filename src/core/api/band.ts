import { isValidJSONStr } from 'utils/validator';
import { base, HttpRequest, HttpProtocolMethod } from './http';
import { EventSetMetadataContent } from 'core/nostr/type';

export interface TrendingProfiles {
	profiles: {
		pubkey: string;
		new_followers_count: number;
		relays: string[];
		profile: {
			id: string;
			pubkey: string;
			kind: number;
			created_at: number;
			sig: string;
			content: string;
		};
	}[];
}

export interface SuggestedProfiles extends Omit<TrendingProfiles, 'profiles'> {
	profiles: Omit<TrendingProfiles['profiles'][number], 'new_followers_count'>[];
}

export class NostrBandProvider extends base {
  constructor(url?: string, httpRequest?: HttpRequest) {
    super(url || 'https://api.nostr.band', httpRequest);
  }

  async getVersion(): Promise<string | null> {
    return await this.httpRequest('version', {}, HttpProtocolMethod.get);
  }

  async suggestFollowings(pubkey: string) {
    const headers = {
      'Content-Type': 'application/json',
    };
    const profiles: SuggestedProfiles = await this.httpRequest(
      'v0/suggested/profiles/'+pubkey,
      {},
      HttpProtocolMethod.get,
      {
        headers,
      },
    );
    return profiles;
  }

	async trendingFollowings() {
    const headers = {
      'Content-Type': 'application/json',
    };
    const profiles: TrendingProfiles = await this.httpRequest(
      'v0/trending/profiles/',
      {},
      HttpProtocolMethod.get,
      {
        headers,
      },
    );
    return profiles;
  }
}

export function parseMetadata(content: string){
	if(!isValidJSONStr(content)){
		return null;
	}
	return JSON.parse(content) as EventSetMetadataContent;
}
