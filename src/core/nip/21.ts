import { EventSetMetadataContent } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import {
  DecodedNaddrResult,
  DecodedNeventResult,
  DecodedNprofileResult,
  DecodedNrelayResult,
  Nip19,
  Nip19DataType,
  Nip19ShareableDataType,
} from './19';
import { OneTimeWebSocketClient } from 'core/api/onetime';
import { dbEventTable, dbProfileTable } from 'core/db';
import { ParsedFragment } from 'components/PostItems/PostContent/text';
import { deserializeMetadata } from 'core/nostr/content';

export interface NpubResult {
  key: string;
  profile:
    | EventSetMetadataContent
    | (EventSetMetadataContent & { created_at })
    | null;
  pubkey: string;
}

export interface NprofileResult {
  key: string;
  profile:
    | EventSetMetadataContent
    | (EventSetMetadataContent & { created_at })
    | null;
  decodedMetadata: DecodedNprofileResult;
}

export interface NoteResult {
  key: string;
  noteEvent: Event | null;
  profile: EventSetMetadataContent | null;
  eventId: string;
}

export interface NeventResult {
  key: string;
  noteEvent: Event | null;
  profile: EventSetMetadataContent | null;
  decodedMetadata: DecodedNeventResult;
}

export interface NaddrResult {
  key: string;
  profile: EventSetMetadataContent | null;
  replaceableEvent: Event | null;
  decodedMetadata: DecodedNaddrResult;
}

export interface NrelayResult {
  key: string;
  decodedMetadata: DecodedNrelayResult;
}

export interface TransformResult {
  type:
    | 'nprofile'
    | 'npub'
    | 'nevent'
    | 'note'
    | 'naddr'
    | 'nrelay'
    | 'unknown';
  result:
    | NaddrResult
    | NeventResult
    | NprofileResult
    | NpubResult
    | NoteResult
    | NrelayResult
    | string;
}

export class Nip21 {
  static async transform(
    pf: ParsedFragment,
    fallbackRelays?: string[],
  ): Promise<TransformResult> {
    const key = pf.content;
    const enableFallback = fallbackRelays && fallbackRelays.length > 0;

    if (/nostr:npub\S+\b/g.test(key)) {
      const transform = async (key: string) => {
        try {
          const npub = key.split(':')[1];
          const { type, data: pubkey } = Nip19.decode(npub);
          if (type !== Nip19DataType.Npubkey) return null;

          let user = await this.getProfile(pubkey);

          if (!user && enableFallback) {
            const _user = await OneTimeWebSocketClient.fetchProfile({
              pubkey,
              relays: fallbackRelays,
            });
            if (_user) {
              user = _user;
            }
          }

          return {
            key,
            profile: user,
            pubkey,
          } as NpubResult;
        } catch (error: any) {
          console.debug('decode failed: ', error.message);
          return null;
        }
      };
      const result = await transform(key);
      if (result) {
        return {
          type: 'npub',
          result,
        };
      }

      return {
        type: 'unknown',
        result: key,
      };
    }

    if (/nostr:nprofile\S+\b/g.test(key)) {
      const transform = async (key: string) => {
        try {
          const nprofile = key.split(':')[1];
          const { type, data: _data } = Nip19.decodeShareable(nprofile);
          if (type !== Nip19ShareableDataType.Nprofile) return null;
          const decodedMetadata = _data as DecodedNprofileResult;
          const pubkey = decodedMetadata.pubkey;

          let user = await this.getProfile(pubkey);

          if (!user && enableFallback) {
            const relays = decodedMetadata.relays || fallbackRelays;
            user = await OneTimeWebSocketClient.fetchProfile({
              pubkey,
              relays,
            });
          }

          return {
            key,
            decodedMetadata,
            profile: user,
          } as NprofileResult;
        } catch (error: any) {
          console.debug('decode failed: ', error.message);
          return null;
        }
      };
      const result = await transform(key);
      if (result) {
        return {
          type: 'nprofile',
          result,
        };
      }

      return {
        type: 'unknown',
        result: key,
      };
    }

    if (/nostr:note\S+\b/g.test(key)) {
      const transform = async (key: string) => {
        try {
          const encodedData = key.split(':')[1];
          const { type, data: eventId } = Nip19.decode(encodedData);
          if (type !== Nip19DataType.EventId) return null;

          let noteEvent: Event | undefined | null = null;
          noteEvent = (await dbEventTable.get(eventId)) as Event | null;

          if (!noteEvent && enableFallback) {
            noteEvent = await OneTimeWebSocketClient.fetchEvent({
              eventId,
              relays: fallbackRelays,
            });
          }

          const profile = noteEvent
            ? await this.getProfile(noteEvent.pubkey)
            : null;

          return {
            key,
            noteEvent,
            profile,
            eventId,
          } as NoteResult;
        } catch (error: any) {
          console.debug('decode failed: ', error.message);
          return null;
        }
      };
      const result = await transform(key);
      if (result) {
        return { type: 'note', result };
      }

      return {
        type: 'unknown',
        result: key,
      };
    }

    if (/nostr:nevent\S+\b/g.test(key)) {
      const transform = async (key: string) => {
        try {
          const nevent = key.split(':')[1];
          const { type, data: _data } = Nip19.decodeShareable(nevent);
          if (type !== Nip19ShareableDataType.Nevent) return null;

          const decodedMetadata = _data as DecodedNeventResult;
          let noteEvent: Event | undefined | null = null;
          noteEvent = await dbEventTable.get(decodedMetadata.id);

          if (!noteEvent && enableFallback) {
            noteEvent = await OneTimeWebSocketClient.fetchEvent({
              eventId: decodedMetadata.id,
              relays: decodedMetadata.relays,
            });
          }

          const profile = noteEvent
            ? await this.getProfile(noteEvent.pubkey)
            : null;

          return {
            key,
            noteEvent,
            profile,
            decodedMetadata,
          } as NeventResult;
        } catch (error: any) {
          console.debug('decode failed: ', error.message);
          return null;
        }
      };
      const result = await transform(key);
      if (result) {
        return { type: 'nevent', result };
      }

      return {
        type: 'unknown',
        result: key,
      };
    }

    if (/nostr:naddr\S+\b/g.test(key)) {
      const transform = async (key: string) => {
        try {
          const naddr = key.split(':')[1];
          const { type, data: _data } = Nip19.decodeShareable(naddr);
          if (type !== Nip19ShareableDataType.Naddr) return null;
          const decodedMetadata = _data as DecodedNaddrResult;

          const pubkey = decodedMetadata.pubkey;
          const identifier = decodedMetadata.identifier;
          const kind = decodedMetadata.kind;
          const relays = decodedMetadata.relays;

          // todo: query from db
          let replaceableEvent: Event | null = null;

          if (!replaceableEvent && enableFallback) {
            replaceableEvent =
              await OneTimeWebSocketClient.fetchReplaceableEvent({
                kind,
                identifier,
                pubkey,
                relays: relays || fallbackRelays,
              });
          }

          const profile = replaceableEvent
            ? await this.getProfile(replaceableEvent.pubkey)
            : null;

          return {
            key,
            decodedMetadata,
            profile,
            replaceableEvent,
          } as NaddrResult;
        } catch (error: any) {
          console.debug('decode failed: ', error.message);
          return null;
        }
      };
      const result = await transform(key);
      if (result) {
        return { type: 'naddr', result };
      }
      return {
        type: 'unknown',
        result: key,
      };
    }

    if (/nostr:nrelay\S+\b/g.test(key)) {
      const transform = async (key: string) => {
        try {
          const nrelay = key.split(':')[1];
          const { type, data: _data } = Nip19.decodeShareable(nrelay);
          if (type !== Nip19ShareableDataType.Nrelay) return null;
          const relay = _data as DecodedNrelayResult;

          return {
            key,
            decodedMetadata: relay,
          } as NrelayResult;
        } catch (error: any) {
          console.debug('decode failed: ', error.message);
          return null;
        }
      };
      const result = await transform(key);
      if (result) {
        return { type: 'nrelay', result };
      }
      return {
        type: 'unknown',
        result: key,
      };
    }

    return { type: 'unknown', result: key };
  }

  private static async getProfile(pk: string) {
    const e = await dbProfileTable.get(pk);
    if (e) {
      return deserializeMetadata(e.content);
    }
    return null;
  }
}
