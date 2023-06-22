import { bech32Decode, bech32Encode } from 'core/crypto';
import { PublicKey, WellKnownEventKind, EventId } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';

import * as secp256k1 from '@noble/secp256k1';

const utf8Decoder = new TextDecoder('utf-8');
const utf8Encoder = new TextEncoder();

export enum Nip19DataType {
  // bare key and id
  Npubkey,
  Nprivkey,
  EventId,
}

export enum Nip19DataPrefix {
  // bare key and id
  Npubkey = 'npub',
  Nprivkey = 'nsec',
  EventId = 'note',
}

export enum Nip19ShareableDataType {
  // shareable identifiers
  Nprofile,
  Nevent,
  Nrelay,
  Naddr,
}

export enum Nip19ShareableDataPrefix {
  // shareable identifiers
  Nprofile = 'nprofile',
  Nevent = 'nevent',
  Nrelay = 'nrelay',
  Naddr = 'naddr',
}

export enum TLVType {
  special = 0,
  relay,
  author,
  kind,
}
export interface TLV {
  [key: number]: Uint8Array[];
}

export interface DecodedShareableResult {
  data: DecodedNprofileResult | DecodedNaddrResult | DecodedNeventResult | DecodedNrelayResult; 
  type: Nip19ShareableDataType;
} 

export interface DecodedNprofileResult {
  pubkey: PublicKey;
  relays: string[];
}

export interface DecodedNaddrResult {
  identifier: string;
  pubkey: PublicKey;
  kind: WellKnownEventKind,
  relays: string[];
}

export interface DecodedNeventResult {
  id: EventId;
  relays: string[];
  author?: string;
}

export type DecodedNrelayResult = string;

export class Nip19 {
  static decode(data: string) {
    const { decoded, prefix } = bech32Decode(data);
    switch (prefix) {
      case Nip19DataPrefix.Npubkey:
        return { data: decoded, type: Nip19DataType.Npubkey };

      case Nip19DataPrefix.Nprivkey:
        return { data: decoded, type: Nip19DataType.Nprivkey };

      case Nip19DataPrefix.EventId:
        return { data: decoded, type: Nip19DataType.EventId };

      default:
        throw new Error(`unsupported prefix type ${prefix}`);
    }
  }

  static decodeShareable(data: string): DecodedShareableResult {
    const { decoded, prefix } = bech32Decode(data);
    const tlv = decodeTLV(secp256k1.utils.hexToBytes(decoded));

    switch (prefix) {
      case Nip19ShareableDataPrefix.Naddr: {
        if (!tlv[0]?.[0]) throw new Error('missing TLV 0 for naddr');
        if (!tlv[2]?.[0]) throw new Error('missing TLV 2 for naddr');
        if (tlv[2][0].length !== 32)
          throw new Error('TLV 2 should be 32 bytes');
        if (!tlv[3]?.[0]) throw new Error('missing TLV 3 for naddr');
        if (tlv[3][0].length !== 4) throw new Error('TLV 3 should be 4 bytes');

        return {
          data: {
            identifier: utf8Decoder.decode(tlv[0][0]),
            pubkey: secp256k1.utils.bytesToHex(tlv[2][0]),
            kind: parseInt(secp256k1.utils.bytesToHex(tlv[3][0]), 16),
            relays: tlv[1] ? tlv[1].map(d => utf8Decoder.decode(d)) : [],
          } as DecodedNaddrResult,
          type: Nip19ShareableDataType.Naddr,
        };
      }

      case Nip19ShareableDataPrefix.Nevent: {
        if (!tlv[0]?.[0]) throw new Error('missing TLV 0 for nevent');
        if (tlv[0][0].length !== 32)
          throw new Error('TLV 0 should be 32 bytes');
        if (tlv[2] && tlv[2][0].length !== 32)
          throw new Error('TLV 2 should be 32 bytes');

        return {
          data: {
            id: secp256k1.utils.bytesToHex(tlv[0][0]),
            relays: tlv[1] ? tlv[1].map(d => utf8Decoder.decode(d)) : [],
            author: tlv[2]?.[0]
              ? secp256k1.utils.bytesToHex(tlv[2][0])
              : void 0,
          } as DecodedNeventResult,
          type: Nip19ShareableDataType.Nevent,
        };
      }

      case Nip19ShareableDataPrefix.Nprofile: {
        if (!tlv[0]?.[0]) throw new Error('missing TLV 0 for nprofile');
        if (tlv[0][0].length !== 32)
          throw new Error('TLV 0 should be 32 bytes');
        return {
          data: {
            pubkey: secp256k1.utils.bytesToHex(tlv[0][0]),
            relays: tlv[1] ? tlv[1].map(d => utf8Decoder.decode(d)) : [],
          } as DecodedNprofileResult,
          type: Nip19ShareableDataType.Nprofile,
        };
      }

      case Nip19ShareableDataPrefix.Nrelay: {
        if (!tlv[0]?.[0]) throw new Error('missing TLV 0 for nrelay');
        return {
          data: utf8Decoder.decode(tlv[0][0]) as DecodedNrelayResult,
          type: Nip19ShareableDataType.Nrelay,
        };
      }

      default:
        throw new Error(`unsupported prefix type ${prefix}`);
    }
  }

  static encode(data: string, type: Nip19DataType) {
    if (data.length === 0) {
      return '';
    }

    switch (type) {
      case Nip19DataType.Npubkey:
        return bech32Encode(data, Nip19DataPrefix.Npubkey);

      case Nip19DataType.Nprivkey:
        return bech32Encode(data, Nip19DataPrefix.Nprivkey);

      case Nip19DataType.EventId:
        return bech32Encode(data, Nip19DataPrefix.EventId);

      default:
        throw new Error(`unsupported type ${type}`);
    }
  }

  static encodeNprofile({
    pubkey,
    relays = [],
  }: {
    pubkey: string;
    relays: string[];
  }) {
    const nprofile = nprofileEncode({ pubkey, relays });
    return 'nostr:' + nprofile;
  }

  static encodeNevent({
    event,
    relays = [],
  }: {
    event: Event;
    relays: string[];
  }) {
    const nevent = neventEncode({ event, relays });
    return 'nostr:' + nevent;
  }

  static encodeNaddr({
    pubkey,
    kind,
    identifier,
    relays = [],
  }: {
    pubkey: PublicKey;
    kind: WellKnownEventKind;
    identifier: string;
    relays: string[];
  }) {
    const naddr = naddrEncode({ pubkey, kind, identifier, relays });
    return 'nostr:' + naddr;
  }

  static encodeNrelay(url: string) {
    const nrelay = nrelayEncode(url);
    return 'nostr:' + nrelay;
  }
}

export function nprofileEncode({
  pubkey,
  relays = [],
}: {
  pubkey: PublicKey;
  relays: string[];
}) {
  const tlv: TLV = {
    [TLVType.special]: [secp256k1.utils.hexToBytes(pubkey)],
    [TLVType.relay]: relays.map(url => utf8Encoder.encode(url)),
  };
  const data = encodeTLV(tlv);
  return bech32Encode(data, Nip19ShareableDataPrefix.Nprofile);
}

export function neventEncode({
  event,
  relays = [],
}: {
  event: Event;
  relays: string[];
}) {
  const tlv: TLV = {
    [TLVType.special]: [secp256k1.utils.hexToBytes(event.id)],
    [TLVType.relay]: relays.map(url => utf8Encoder.encode(url)),
    [TLVType.author]: event.pubkey
      ? [secp256k1.utils.hexToBytes(event.pubkey)]
      : [],
  };
  const data = encodeTLV(tlv);
  return bech32Encode(data, Nip19ShareableDataPrefix.Nevent);
}

function naddrEncode({
  pubkey,
  kind,
  identifier,
  relays = [],
}: {
  pubkey: PublicKey;
  kind: WellKnownEventKind;
  identifier: string;
  relays: string[];
}) {
  const theKind = new ArrayBuffer(4);
  new DataView(theKind).setUint32(0, kind, false);
  const tlv = {
    [TLVType.special]: [utf8Encoder.encode(identifier)],
    [TLVType.relay]: relays.map(url => utf8Encoder.encode(url)),
    [TLVType.author]: [secp256k1.utils.hexToBytes(pubkey)],
    [TLVType.kind]: [new Uint8Array(theKind)],
  };
  const data = encodeTLV(tlv);
  return bech32Encode(data, Nip19ShareableDataPrefix.Naddr);
}

function nrelayEncode(url: string) {
  const tlv: TLV = {
    [TLVType.relay]: [utf8Encoder.encode(url)],
  };
  const data = encodeTLV(tlv);
  return bech32Encode(data, Nip19ShareableDataPrefix.Nrelay);
}

export function encodeTLV(tlv: TLV) {
  const entries: Uint8Array[] = [];
  Object.entries(tlv).forEach(([t, vs]) => {
    vs.forEach(v => {
      const entry = new Uint8Array(v.length + 2);
      entry.set([parseInt(t)], 0);
      entry.set([v.length], 1);
      entry.set(v, 2);
      entries.push(entry);
    });
  });
  return secp256k1.utils.bytesToHex(secp256k1.utils.concatBytes(...entries));
}

export function decodeTLV(data: Uint8Array): TLV {
  const result: TLV = {};
  let rest = data;
  while (rest.length > 0) {
    const t = rest[0];
    const l = rest[1];
    const v = rest.slice(2, 2 + l);
    rest = rest.slice(2 + l);
    if (v.length < l) continue;
    result[t] = result[t] || [];
    result[t].push(v);
  }
  return result;
}
