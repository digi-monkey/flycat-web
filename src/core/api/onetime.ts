import {
  PublicKey,
  WellKnownEventKind,
  EventSetMetadataContent,
  EventTags,
  EventPTag,
  Filter,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { ConnPool } from 'core/api/pool';
import { WS } from 'core/api/ws';
import { mergeAndSortUniqueDbEvents } from 'utils/common';

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
    const pool = new ConnPool();
    pool.addConnections(relays);
    const fn = async (ws: WS) => {
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
      dataStream.unsubscribe();
      return result;
    };
    const results = (await pool.executeConcurrently(fn)) as Event[];
    if (results.length === 0) return null;

    const profileEvent = results.reduce((acc, curr) => {
      if (curr?.created_at > acc?.created_at) {
        return curr;
      } else {
        return acc;
      }
    }, results[0]);

    if (profileEvent == null) return null;

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
    const pool = new ConnPool();
    pool.addConnections(relays);
    const fn = async (ws: WS) => {
      const dataStream = ws.subFilter({
        kinds: [WellKnownEventKind.contact_list],
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
      dataStream.unsubscribe();
      return result;
    };
    const results = (await pool.executeConcurrently(fn)) as Event[];
    if (results.length === 0) return null;

    const newestContactListEvent = results.reduce((acc, curr) => {
      if (curr?.created_at > acc?.created_at) {
        return curr;
      } else {
        return acc;
      }
    }, results[0]);

    if (newestContactListEvent == null) return null;

    return newestContactListEvent.tags
      .filter(t => t[0] === EventTags.P)
      .map(t => (t as EventPTag)[1]);
  }

  static async fetchEvent({
    eventId,
    relays,
  }: {
    eventId: string;
    relays: string[];
  }) {
    const pool = new ConnPool();
    pool.addConnections(relays);
    const fn = async (ws: WS) => {
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
      dataStream.unsubscribe();
      return result;
    };
    const results = (await pool.executeConcurrently(fn)) as Event[];
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
    const pool = new ConnPool();
    pool.addConnections(relays);
    const fn = async (ws: WS) => {
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
      dataStream.unsubscribe();
      return result;
    };
    const results = (await pool.executeConcurrently(fn)) as Event[];
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

  static async fetchEventByFilter({
    filter,
    relays,
  }: {
    filter: Filter;
    relays: string[];
  }) {
    const pool = new ConnPool();
    pool.addConnections(relays);
    const fn = async (ws: WS) => {
      const dataStream = ws.subFilter(filter);
      const result: Event[] = [];
      for await (const event of dataStream) {
        if (!result.map(r => r.id).includes(event.id)) {
          result.push(event);
        }
      }
      dataStream.unsubscribe();
      return result;
    };
    const results = (await pool.executeConcurrently(fn)).flat(1) as any;
    return mergeAndSortUniqueDbEvents(results, results);
  }
}
