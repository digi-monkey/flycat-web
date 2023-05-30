import {
  EventZTag,
  PublicKey,
  RawEvent,
  WellKnownEventKind,
} from 'service/api';
import { bech32Decode } from 'service/crypto';
import fetch from "cross-fetch";

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
    lnurl: string;
    amount: string;
    relays: string[];
    receipt: PublicKey;
    e?: string;
    a?: string;
  }): RawEvent {
    const relaysTag = ['relays', ...relays].join(', ');
    const tags = [
      relaysTag,
      ['amount', amount],
      ['lnurl', lnurl],
      ['p', receipt],
    ];
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

  static async getZapEndpoint(tag: EventZTag) {
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

		const res = await fetch(lnurl)
    const body = await res.json()

    if (body.allowsNostr && body.nostrPubkey) {
      return body.callback
    }

		return null;
  }
}
