import { EventId, PublicKey, WellKnownEventKind } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { CallWorker } from 'core/worker/caller';
import { useEffect } from 'react';
import { EventWithSeen } from 'pages/type';
import { CallRelayType } from 'core/worker/type';
import { Nip23 } from 'core/nip/23';

export function useSubReplyEvents({
  rootEvent,
  commentList,
  worker,
  handleEvent,
  newConn,
}: {
  rootEvent: Event;
  newConn: string[];
  commentList: EventWithSeen[];
  worker?: CallWorker;
  handleEvent: (event: Event, relayUrl?: string) => any;
}) {
  useEffect(() => {
    if (!worker) return;

    const callRelay =
      newConn.length > 0
        ? {
            type: CallRelayType.batch,
            data: newConn,
          }
        : {
            type: CallRelayType.connected,
            data: [],
          };

    switch (rootEvent.kind) {
      case WellKnownEventKind.text_note:
        {
          const newIds = commentList.map(e => e.id);
          if (commentList.length === 0) {
            newIds.push(rootEvent.id);
          }
          worker
            .subMsgByETags(newIds, undefined, callRelay)
            .iterating({ cb: handleEvent });
        }
        break;

      case WellKnownEventKind.long_form:
        {
          if (commentList.length === 0) {
            const filter = Nip23.toPullCommentFilterFromEvent(rootEvent);
            console.log('Nip23 comment filter: ', filter);
            worker
              .subFilter({ filter, callRelay })
              .iterating({ cb: handleEvent });
          }

          const newIds = commentList.map(e => e.id);
          if (newIds.length > 0)
            worker
              .subMsgByETags(newIds, undefined, callRelay)
              .iterating({ cb: handleEvent });
        }
        break;

      default:
        break;
    }
  }, [commentList.length, rootEvent, worker, newConn]);
}

export function useSubUserMetadata({
  myPublicKey,
  unknownPks,
  worker,
  handleEvent,
  rootEvent,
  newConn,
}: {
  newConn: string[];
  myPublicKey: PublicKey;
  unknownPks: PublicKey[];
  worker?: CallWorker;
  rootEvent?: Event;
  handleEvent: (event: Event, relayUrl?: string) => any;
}) {
  useEffect(() => {
    if (!worker) return;

    const callRelay =
      newConn.length > 0
        ? {
            type: CallRelayType.batch,
            data: newConn,
          }
        : {
            type: CallRelayType.connected,
            data: [],
          };
    const pks = [myPublicKey, ...unknownPks];
    if (rootEvent?.pubkey) {
      pks.push(rootEvent.pubkey);
    }
    worker
      .subMetadata(pks, undefined, callRelay)
      ?.iterating({ cb: handleEvent });
  }, [unknownPks.length, worker, rootEvent, newConn]);
}
