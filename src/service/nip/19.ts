import { bech32Decode, bech32Encode } from "service/crypto";
import { nip19 } from 'nostr-tools';

export enum Nip19DataType {
  Pubkey = 'pubkey',
  Privkey = 'privkey',
  EventId = 'eventId',
}

export enum Nip19DataPrefix {
  Pubkey = 'npub',
  Privkey = 'nsec',
  EventId = 'note',
}

export enum Nip19MetaDataPerfix {
  Nprofile = 'nprofile',
  Nevent = 'nevent',
  Nrelay = 'nrelay',
  Naddr = 'naddr',
}

export class Nip19 {
  static decode(data: string) {
    const { decoded, prefix } = bech32Decode(data);
    switch (prefix) {
      case Nip19DataPrefix.Pubkey:
        return { data: decoded, type: Nip19DataType.Pubkey };
  
      case Nip19DataPrefix.Privkey:
        return { data: decoded, type: Nip19DataType.Privkey };
  
      case Nip19DataPrefix.EventId:
        return { data: decoded, type: Nip19DataType.EventId };
  
      default:
        throw new Error(`unsupported prefix type ${prefix}`);
    }
  }

  static encode(data: string, type: Nip19DataType) {
    if (data.length === 0) {
      return '';
    }
  
    switch (type) {
      case Nip19DataType.Pubkey:
        return bech32Encode(data, Nip19DataPrefix.Pubkey);
  
      case Nip19DataType.Privkey:
        return bech32Encode(data, Nip19DataPrefix.Privkey);
  
      case Nip19DataType.EventId:
        return bech32Encode(data, Nip19DataPrefix.EventId);
      default:
        throw new Error(`unsupported type ${type}`);
    }
  }

  static nprofileEncode(pubkey: string, relays: string[]) {
    const nprofile = nip19.nprofileEncode({pubkey, relays});
    return "nostr:" + nprofile;
  }

  static nprofileDecode(link) {
    const result = nip19.decode(link).data as { pubkey: string }
    return result.pubkey;
  }
}
