import { i18n } from 'next-i18next';
import {
  Event,
  EventSetMetadataContent,
  PublicKey,
  WellKnownEventKind,
} from 'service/api';
import {
  DecodedNaddrResult,
  DecodedNeventResult,
  DecodedNprofileResult,
  DecodedNrelayResult,
  Nip19,
  Nip19DataType,
  Nip19ShareableDataType,
} from './19';
import { Paths } from 'constants/path';
import { UserMap } from 'service/type';
import { ConnPool } from 'service/relay/connection/pool';
import { WS } from 'service/relay/connection/ws';
import { shortPublicKey } from 'service/helper';

export class Nip21 {
  // todo: change for-loop to parallel and re-use connection on fallback relays
  static async replaceNpub(
    content: string,
    userMap: UserMap,
    fallbackRelays: string[],
  ) {
    const match = /nostr:npub\S*\b/g.exec(content);
    if (match == null || match?.length === 0) return content;

    const replace = async (key: string) => {
      const npub = key.split(':')[1];
      const { type, data: pubkey } = Nip19.decode(npub);
      if (type !== Nip19DataType.Npubkey) return content;

      let user:
        | EventSetMetadataContent
        | (EventSetMetadataContent & { created_at })
        | null = null;

      const userMapItem = userMap.get(pubkey);
      if (userMapItem) {
        user = userMapItem;
      }

      if (!user) {
        const _user = await fetchProfile({ pubkey, relays: fallbackRelays });
        if (_user) {
          user = _user;
        }
      }

      content = content.replace(
        key,
        `<a href="${i18n?.language + Paths.user + pubkey}" target="_self">@${
          user?.name || shortPublicKey(pubkey)
        }</a>`,
      );
      return content;
    };

    for (const key of match) {
      content = await replace(key);
    }

    return content;
  }

  static async replaceNprofile(
    content: string,
    userMap: UserMap,
    fallbackRelays: string[],
  ) {
    const match = /nostr:nprofile\S*\b/g.exec(content);
    if (match == null || match?.length === 0) return content;

    const replace = async (key: string) => {
      const nprofile = key.split(':')[1];
      const { type, data: _data } = Nip19.decodeShareable(nprofile);
      if (type !== Nip19ShareableDataType.Nprofile) return content;
      const data = _data as DecodedNprofileResult;
      const pubkey = data.pubkey;

      let user:
        | EventSetMetadataContent
        | (EventSetMetadataContent & { created_at })
        | null = null;

      const userMapItem = userMap.get(pubkey);
      if (userMapItem) {
        user = userMapItem;
      }

      if (!user) {
        const relays = data.relays || fallbackRelays;
        let _user = await fetchProfile({ pubkey, relays });
        if (_user == null && data.relays) {
          _user = await fetchProfile({ pubkey, relays: fallbackRelays });
        }

        if (_user) {
          user = _user;
        }
      }

      content = content.replace(
        key,
        `<a href="/${i18n?.language + Paths.user + pubkey}" target="_self">@${
          user?.name || shortPublicKey(pubkey)
        }</a>`,
      );

      return content;
    };

    for (const key of match) {
      content = await replace(key);
    }

    return content;
  }

  static async replaceNote(content: string, fallbackRelays: string[]) {
    const match = /nostr:note\S*\b/g.exec(content);
    if (match == null || match?.length === 0) return content;

    const replace = async (key: string) => {
      const encodedData = key.split(':')[1];
      const { type, data: eventId } = Nip19.decode(encodedData);
      if (type !== Nip19DataType.EventId) return content;

      const event = await fetchNoteEvent({ eventId, relays: fallbackRelays });

      content = content.replace(
        key,
        `<a href="/${
          i18n?.language + Paths.event + eventId
        }" target="_self">note@${event?.id || eventId}</a>`,
      );

      return content;
    };

    for (const key of match) {
      content = await replace(key);
    }

    return content;
  }

  static async replaceNevent(content: string, userMap: UserMap) {
    const match = /nostr:nevent\S*\b/g.exec(content);
    if (match == null || match?.length === 0) return content;

    const replace = async (key: string) => {
      const nevent = key.split(':')[1];
      const { type, data: _data } = Nip19.decodeShareable(nevent);
      if (type !== Nip19ShareableDataType.Nevent) return content;

      const data = _data as DecodedNeventResult;
      const eventId = data.id;

      const event = await fetchNoteEvent({ eventId, relays: data.relays });

      content = content.replace(
        key,
        `<a href="${
          i18n?.language + Paths.event + eventId
        }" target="_self">note@${event?.id || eventId}</a>`,
      );
      return content;
    };

    for (const key of match) {
      content = await replace(key);
    }

    return content;
  }

  static async replaceNaddr(content: string, fallbackRelays: string[]) {
    const match = /nostr:naddr\S*\b/g.exec(content);
    if (match == null || match?.length === 0) return content;

    const replace = async (key: string) => {
      const naddr = key.split(':')[1];
      const { type, data: _data } = Nip19.decodeShareable(naddr);
      if (type !== Nip19ShareableDataType.Naddr) return content;
      const data = _data as DecodedNaddrResult;

      const pubkey = data.pubkey;
      const identifier = data.identifier;
      const kind = data.kind;
      const relays = data.relays;

      let event = await fetchReplaceableEvent({
        kind,
        identifier,
        pubkey,
        relays,
      });

      if (!event) {
        event = await fetchReplaceableEvent({
          kind,
          identifier,
          pubkey,
          relays: fallbackRelays,
        });
      }

      content = content.replace(
        key,
        `<a href="${
          i18n?.language + Paths.event + identifier
        }" target="_self">naddr@${pubkey}:${kind}:${identifier}</a>`,
      );
      return content;
    };

    for (const key of match) {
      content = await replace(key);
    }

    return content;
  }

  static async replaceNrelay(content: string) {
    const match = /nostr:nrelay\S*\b/g.exec(content);
    if (match == null || match?.length === 0) return content;

    const replace = async (key: string) => {
      const nrelay = key.split(':')[1];
      const { type, data: _data } = Nip19.decodeShareable(nrelay);
      if (type !== Nip19ShareableDataType.Nrelay) return content;
      const relay = _data as DecodedNrelayResult;

      content = content.replace(
        key,
        `<a href="${
          i18n?.language + Paths.event + relay
        }" target="_self">relay@${relay}</a>`,
      );
      return content;
    };

    for (const key of match) {
      content = await replace(key);
    }

    return content;
  }
}

export async function fetchProfile({
  pubkey,
  relays,
}: {
  pubkey: PublicKey;
  relays: string[];
}) {
  const sub = new ConnPool();
  sub.addConnections(relays);
  const fn = async (conn: WebSocket) => {
    const ws = new WS(conn);
    const dataStream = ws.subFilter({
      kinds: [WellKnownEventKind.set_metadata],
      limit: 1,
      authors: [pubkey],
    });
    let result: Event | null = null;

    for await (const data of dataStream) {
      if (!result) result = data;
      if (result && result.created_at < data.created_at) {
        result = data;
      }
    }
    return result;
  };
  const results = (await sub.executeConcurrently(fn)) as Event[];
  if (results.length === 0) return null;

  const profileEvent = results.reduce((acc, curr) => {
    if (curr.created_at > acc.created_at) {
      return curr;
    } else {
      return acc;
    }
  }, results[0]);

  const user: EventSetMetadataContent = JSON.parse(profileEvent.content);
  return user;
}

export async function fetchNoteEvent({
  eventId,
  relays,
}: {
  eventId: string;
  relays: string[];
}) {
  const sub = new ConnPool();
  sub.addConnections(relays);
  const fn = async (conn: WebSocket) => {
    const ws = new WS(conn);
    const dataStream = ws.subFilter({
      ids: [eventId],
      limit: 1,
    });
    let result: Event | null = null;

    for await (const data of dataStream) {
      if (!result) result = data;
      if (result && result.created_at < data.created_at) {
        result = data;
      }
    }
    return result;
  };
  const results = (await sub.executeConcurrently(fn)) as Event[];
  if (results.length === 0) return null;

  const event = results.reduce((acc, curr) => {
    if (curr.created_at > acc.created_at) {
      return curr;
    } else {
      return acc;
    }
  }, results[0]);

  return event;
}

export async function fetchReplaceableEvent({
  kind,
  identifier,
  pubkey,
  relays,
}: {
  kind: WellKnownEventKind;
  identifier: string;
  pubkey: PublicKey;
  relays: string[];
}) {
  const sub = new ConnPool();
  sub.addConnections(relays);
  const fn = async (conn: WebSocket) => {
    const ws = new WS(conn);
    const dataStream = ws.subFilter({
      kinds: [kind],
      '#d': [identifier],
      authors: [pubkey],
      limit: 1,
    });
    let result: Event | null = null;

    for await (const data of dataStream) {
      if (!result) result = data;
      if (result && result.created_at < data.created_at) {
        result = data;
      }
    }
    return result;
  };
  const results = (await sub.executeConcurrently(fn)) as Event[];
  if (results.length === 0) return null;

  const event = results.reduce((acc, curr) => {
    if (curr.created_at > acc.created_at) {
      return curr;
    } else {
      return acc;
    }
  }, results[0]);

  return event;
}
