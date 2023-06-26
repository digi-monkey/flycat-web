import { EventId, PublicKey } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { CallWorker } from 'core/worker/caller';
import { useEffect } from 'react';
import { EventWithSeen } from 'pages/type';
import { CallRelayType } from 'core/worker/type';

export function useSubRootEvent({
  eventId,
  worker,
  handleEvent,
	newConn
}: {
  eventId: EventId;
  worker?: CallWorker;
  handleEvent: (event: Event, relayUrl?: string) => any;
	newConn: string[]
}) {
  useEffect(() => {
    if (!worker) return;

		const callRelay = {type: CallRelayType.batch, data: newConn};
    worker.subMsgByEventIds([eventId], undefined, callRelay).iterating({ cb: handleEvent });
  }, [eventId, worker, newConn]);
}

export function useSubReplyEvents({
  eventId,
  commentList,
  worker,
  handleEvent,
	newConn,
}: {
  eventId: EventId;
	newConn: string[];
  commentList: EventWithSeen[];
  worker?: CallWorker;
  handleEvent: (event: Event, relayUrl?: string) => any;
}) {
	//const sentEventIds: EventId[] = [];
  useEffect(() => {
    if (!worker) return;

		const callRelay = newConn.length > 0? {
			type: CallRelayType.batch,
			data: newConn
		}:{
			type: CallRelayType.connected,
			data: []
		}
		const newIds = commentList.map(e => e.id).concat(eventId);
    worker.subMsgByETags(newIds, undefined, callRelay).iterating({ cb: handleEvent });
		//sentEventIds.concat(newIds);
  }, [commentList.length, eventId, worker, newConn]);
}

export function useSubUserMetadata({
  myPublicKey,
  unknownPks,
  worker,
  handleEvent,
	rootEvent,
	newConn
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

		const callRelay = newConn.length > 0? {
			type: CallRelayType.batch,
			data: newConn
		}:{
			type: CallRelayType.connected,
			data: []
		}
		const pks = [myPublicKey, ...unknownPks];
		if(rootEvent?.pubkey){
			pks.push(rootEvent.pubkey);
		}
		worker.subMetadata(pks, undefined, callRelay)?.iterating({ cb: handleEvent });
  }, [unknownPks.length, worker, rootEvent, newConn]);
}
