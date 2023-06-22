import {
  PublicKey,
  WellKnownEventKind,
  EventSetMetadataContent,
  EventTags,
  EventETag,
  EventPTag
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { ConnPool } from 'core/relay/connection/pool';
import { WS } from 'core/relay/connection/ws';

// the main websocket handler is in the shared-worker across all the pages(see worker/worker0.ts worker1.ts callWorker.ts)
// this one time websocket client is used in only some temp data fetching
export class OneTimeWebSocketClient {
  static async fetchProfile({
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
      if (curr?.created_at > acc?.created_at) {
        return curr;
      } else {
        return acc;
      }
    }, results[0]);

		if(profileEvent == null)return null;
		
    const user: EventSetMetadataContent = JSON.parse(profileEvent.content);
    return user;
  }

  static async fetchContactList({
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
        kinds: [WellKnownEventKind.contact_list],
        limit: 1,
        authors: [pubkey],
      });
      let result: Event | null = null;

      for await (const data of dataStream) {
        console.log(data);
        if (!result) result = data;
        if (result && result.created_at < data.created_at) {
          result = data;
        }
      }
      return result;
    };
    const results = (await sub.executeConcurrently(fn)) as Event[];
    if (results.length === 0) return null;

    const newestContactListEvent = results.reduce((acc, curr) => {
      if (curr?.created_at > acc?.created_at) {
        return curr;
      } else {
        return acc;
      }
    }, results[0]);
    console.log("result", results, newestContactListEvent)

		if(newestContactListEvent == null)return null;
		
   return newestContactListEvent.tags.filter(t => t[0] === EventTags.P).map(t => (t as EventPTag)[1]);
  }

  static async fetchEvent({
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
      if (curr?.created_at > acc?.created_at) {
        return curr;
      } else {
        return acc;
      }
    }, results[0]);

    return event;
  }

  static async fetchReplaceableEvent({
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
}
