import { i18n } from 'next-i18next';
import { Event, EventSetMetadataContent, WellKnownEventKind } from 'service/api';
import {
  DecodedNprofileResult,
  Nip19,
  Nip19DataType,
  Nip19ShareableDataPrefix,
  Nip19ShareableDataType,
} from './19';
import { Paths } from 'constants/path';
import { UserMap } from 'service/type';
import { ConnPool } from 'service/relay/connection/pool';
import { WS } from 'service/relay/connection/ws';

export class Nip21 {
  static replaceNpub(content: string, userMap: UserMap) {
    // nostr:npub1sn0wdenkukak0d9dfczzeacvhkrgz92ak56egt7vdgzn8pv2wfqqhrjdv9
    const match = /nostr:npub\S*\b/g.exec(content);

    if (userMap.size && match?.length) {
      const key = match[0];
      const npub = key.split(':')[1];
      const { type, data } = Nip19.decode(npub);
      if (type !== Nip19DataType.Npubkey) return content;

      const pubkey = data;
      const user = userMap.get(pubkey);
      if (user) {
        content = content.replace(
          key,
          `<a href="${i18n?.language + Paths.user + pubkey}" target="_self">@${
            user.name
          }</a>`,
        );
      }
    }

    return content;
  }

  static async replaceNprofile(
    event: Event,
    userMap: UserMap,
    fallbackRelays: string[],
  ) {
    let content = event.content;
    const match = /nostr:nprofile\S*\b/g.exec(content);

    if (userMap.size && match?.length) {
      const key = match[0];
      const nprofile = key.split(':')[1];
      const { type, data: _data } = Nip19.decodeShareable(nprofile);
      if (type !== Nip19ShareableDataType.Nprofile) return content;
      const data = _data as DecodedNprofileResult;
      const pubkey = data.pubkey;
      const user = userMap.get(pubkey);
      if (user) {
        content = content.replace(
          key,
          `<a href="${i18n?.language + Paths.user + pubkey}" target="_self">@${
            user.name
          }</a>`,
        );
      } else {
        const relays = data.relays || fallbackRelays;
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
            if(!result)result = data;
            if(result && result.created_at < data.created_at){
              result = data;
            }
          }
          return result;
        };
        const results = await sub.executeConcurrently(fn) as Event[];
        if(results.length === 0)return content;

        const profileEvent =results.reduce((acc, curr) => {
          if (curr.created_at > acc.created_at) {
            return curr;
          } else {
            return acc;
          }
        }, results[0]);

        const user: EventSetMetadataContent = JSON.parse(profileEvent.content);
        content = content.replace(
          key,
          `<a href="${i18n?.language + Paths.user + pubkey}" target="_self">@${
            user.name
          }</a>`,
        ); 
      }
    }

    return content;
  }

  static replaceNote(content: string, userMap: UserMap) {
    // TODO
    // nostr:note1fntxtkcy9pjwucqwa9mddn7v03wwwsu9j330jj350nvhpky2tuaspk6nqc
    const match = /nostr:note\S*\b/g.exec(content);

    if (userMap.size && match?.length) {
      const key = match[0];
      const encodedData = key.split(':')[1];
      const { type, data } = Nip19.decode(encodedData);
      if (type !== Nip19DataType.EventId) return content;

      if (data) {
        content = content.replace(
          key,
          `<a href="${
            i18n?.language + Paths.event + data
          }" target="_self">@${data}</a>`,
        );
      }
    }

    return content;
  }

  static replaceNevent(content: string, userMap: UserMap) {
    // TODO
    // nostr:nevent1qqstna2yrezu5wghjvswqqculvvwxsrcvu7uc0f78gan4xqhvz49d9spr3mhxue69uhkummnw3ez6un9d3shjtn4de6x2argwghx6egpr4mhxue69uhkummnw3ez6ur4vgh8wetvd3hhyer9wghxuet5nxnepm
    const match = /nostr:nevent\S*\b/g.exec(content);

    if (userMap.size && match?.length) {
      const key = match[0];
      const nevent = key.split(':')[1];
      const { type, data } = Nip19.decodeShareable(nevent);
      if (type !== Nip19ShareableDataType.Nevent) return content;

      const id = (data as any).id;
      const pubkey = (data as any).author;
      const user = userMap.get(pubkey);
      if (user) {
        content = content.replace(
          key,
          `<a href="${
            i18n?.language + Paths.event + id
          }" target="_self">@${id}</a>`,
        );
      }
    }

    return content;
  }

  static replaceNaddr(content: string, userMap: UserMap) {
    // TODO
    // nostr:naddr1qq8rzmfdwdshguedd9khqctrwspzqf8r0s09kryt4rw7ya2tel7x8ddjn8uqvnu0hy5teuc4h8zfvhemqvzqqqr48y6aua72
    const match = /nostr:naddr\S*\b/g.exec(content);

    if (userMap.size && match?.length) {
      const key = match[0];
      const naddr = key.split(':')[1];
      const { type, data } = Nip19.decodeShareable(naddr);
      if (type !== Nip19ShareableDataType.Naddr) return content;

      const identifier = (data as any).identifier;
      const pubkey = (data as any).pubKey;
      const user = userMap.get(pubkey);
      if (user) {
        content = content.replace(
          key,
          `<a href="${
            i18n?.language + Paths.event + identifier
          }" target="_self">@${identifier}</a>`,
        );
      }
    }

    return content;
  }
}
