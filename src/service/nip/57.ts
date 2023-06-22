import {
  EventSetMetadataContent,
  EventZTag,
  PublicKey,
  WellKnownEventKind
} from 'service/event/type';
import { RawEvent } from 'service/event/RawEvent';
import { bech32Decode } from 'service/crypto';
import fetch from 'cross-fetch';

export class Nip57 {
  public static kind_request = WellKnownEventKind.zap_request;
  public static kind_receipt = WellKnownEventKind.zap_receipt;

  static createRequest({
    lnurl,
    amount,
    relays,
    receipt,
    e,
    a,
  }: {
    lnurl?: string;
    amount?: string;
    relays: string[];
    receipt: PublicKey;
    e?: string;
    a?: string;
  }): RawEvent {
    const relaysTag = ['relays'];
		for(const r of relays){
			relaysTag.push(r);
		}
		
    const tags = [
      relaysTag,
      ['p', receipt],
    ];
		if(amount){
			tags.push(['amount', amount]);
		}
		if(lnurl){
			tags.push(['lnurl', lnurl]);
		}
    if (e) {
      tags.push(['e', e]);
    }
    if (a) {
      tags.push(['a', a]);
    }
    const event: RawEvent = new RawEvent(
      '',
      this.kind_request,
      tags as any,
      'Zap!',
    );
    return event;
  }

  static createReceipt({
    receipt,
    bolt11Invoice,
    preimage,
    description,
    e,
  }: {
    receipt: PublicKey;
    bolt11Invoice: string;
    preimage: string;
    description: string;
    e?: string;
  }): RawEvent {
    const tags = [
      ['p', receipt],
      ['bolt11', bolt11Invoice],
      ['description', description],
      ['preimage', preimage],
    ];
    if (e) {
      tags.push(['e', e]);
    }
    const event: RawEvent = new RawEvent(
      '',
      this.kind_receipt,
      tags as any,
      '',
    );
    return event;
  }

  static validateReceipt() {
    // todo
  }

  static async getZapEndpointByTag(tag: EventZTag) {
    const value = tag[1];
    const type = tag[2];

    let lnurl: string | null;

    switch (type) {
      case 'lud06':
        {
          const { decoded } = bech32Decode(value);
          lnurl = decoded;
        }
        break;

      case 'lud16':
        {
          const [name, domain] = value.split('@');
          lnurl = `https://${domain}/.well-known/lnurlp/${name}`;
        }
        break;

      default:
        // lud06
        {
          const { decoded } = bech32Decode(value);
          lnurl = decoded;
        }
        break;
    }

    const res = await fetch(lnurl);
    const body = await res.json();

    if (body.allowsNostr && body.nostrPubkey) {
      return body.callback;
    }

    return null;
  }

  static async getZapEndpointByProfile(profile: EventSetMetadataContent) {
    let lnurl: string | null = null;

    if (profile.lud06) {
      lnurl = profile.lud06;
    }

    if (profile.lud16) {
      const [name, domain] = profile.lud16.split('@');
      lnurl = `https://${domain}/.well-known/lnurlp/${name}`;
    }

    if (lnurl == null) return null;

    const res = await fetch(lnurl);
    const body = await res.json();

    if (body.allowsNostr && body.nostrPubkey) {
      return body.callback;
    }

    return null;
  }
}
