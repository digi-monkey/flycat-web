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
import { dbEventTable, dbProfileTable, dexieDb } from 'core/db';
import { ParsedFragment } from 'components/PostItems/PostContent/text';

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
        const npub = key.split(':')[1];
        const { type, data: pubkey } = Nip19.decode(npub);
        if (type !== Nip19DataType.Npubkey) return null;

        let user:
          | EventSetMetadataContent
          | (EventSetMetadataContent & { created_at })
          | null = null;

        const profileEvent = await dexieDb.profileEvent.get(pubkey);
        if (profileEvent) {
          user = JSON.parse(profileEvent.content) as EventSetMetadataContent;
        }

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
        };
      };
      const result = (await transform(key)) as NpubResult;
      return {
        type: 'npub',
        result,
      };
    }

    if (/nostr:nprofile\S+\b/g.test(key)) {
      const transform = async (key: string) => {
        const nprofile = key.split(':')[1];
        const { type, data: _data } = Nip19.decodeShareable(nprofile);
        if (type !== Nip19ShareableDataType.Nprofile) return null;
        const decodedMetadata = _data as DecodedNprofileResult;
        const pubkey = decodedMetadata.pubkey;

        let user:
          | EventSetMetadataContent
          | (EventSetMetadataContent & { created_at })
          | null = null;

        const profileEvent = await dexieDb.profileEvent.get(pubkey);
        if (profileEvent) {
          user = JSON.parse(profileEvent.content) as EventSetMetadataContent;
        }

        if (!user && enableFallback) {
          const relays = decodedMetadata.relays || fallbackRelays;
          let _user = await OneTimeWebSocketClient.fetchProfile({
            pubkey,
            relays,
          });
          if (_user == null && decodedMetadata.relays) {
            _user = await OneTimeWebSocketClient.fetchProfile({
              pubkey,
              relays: fallbackRelays,
            });
          }

          if (_user) {
            user = _user;
          }
        }

        return {
          key,
          decodedMetadata,
          profile: user,
        };
      };
      const result = (await transform(key)) as NprofileResult;
      return {
        type: 'nprofile',
        result,
      };
    }

    if (/nostr:note\S+\b/g.test(key)) {
      const transform = async (key: string) => {
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
          ? await dbProfileTable.get(noteEvent.pubkey)
          : null;

        return {
          key,
          noteEvent,
          profile,
          eventId,
        };
      };
      const result = (await transform(key)) as NoteResult;
      return { type: 'note', result };
    }

    if (/nostr:nevent\S+\b/g.test(key)) {
      const transform = async (key: string) => {
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
          ? await dbProfileTable.get(noteEvent.pubkey)
          : null;

        return {
          key,
          noteEvent,
          profile,
          decodedMetadata,
        };
      };
      const result = (await transform(key)) as NeventResult;
      return { type: 'nevent', result };
    }

    if (/nostr:naddr\S+\b/g.test(key)) {
      const transform = async (key: string) => {
        const naddr = key.split(':')[1];
        const { type, data: _data } = Nip19.decodeShareable(naddr);
        if (type !== Nip19ShareableDataType.Naddr) return null;
        const decodedMetadata = _data as DecodedNaddrResult;

        const pubkey = decodedMetadata.pubkey;
        const identifier = decodedMetadata.identifier;
        const kind = decodedMetadata.kind;
        const relays = decodedMetadata.relays;

        let replaceableEvent =
          await OneTimeWebSocketClient.fetchReplaceableEvent({
            kind,
            identifier,
            pubkey,
            relays,
          });

        if (!replaceableEvent && enableFallback) {
          replaceableEvent = await OneTimeWebSocketClient.fetchReplaceableEvent(
            {
              kind,
              identifier,
              pubkey,
              relays: fallbackRelays,
            },
          );
        }

        return {
          key,
          decodedMetadata,
          replaceableEvent,
        };
      };
      const result = (await transform(key)) as NaddrResult;
      return { type: 'naddr', result };
    }

    if (/nostr:nrelay\S+\b/g.test(key)) {
      const transform = async (key: string) => {
        const nrelay = key.split(':')[1];
        const { type, data: _data } = Nip19.decodeShareable(nrelay);
        if (type !== Nip19ShareableDataType.Nrelay) return null;
        const relay = _data as DecodedNrelayResult;

        return {
          key,
          decodedMetadata: relay,
        };
      };
      const result = (await transform(key)) as NrelayResult;
      return { type: 'nrelay', result };
    }

    return { type: 'unknown', result: key };
  }
}
