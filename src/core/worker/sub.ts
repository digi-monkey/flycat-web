import { Event } from 'core/nostr/Event';
import { FromProducerMsg, FromProducerMsgType, PubEventResultMsg, SubFilterResultMsg } from './type';
import { EventId } from 'core/nostr/type';

export interface SubFilterResultStream extends AsyncIterableIterator<SubFilterResultMsg> {
  unsubscribe(): void;
  id: string;
}

export function createSubFilterResultStream(
  port: MessagePort,
  subId: string,
): SubFilterResultStream {
  let observer: ((done: boolean, value?: SubFilterResultMsg) => void) | null;

  const onMessage =  (e: MessageEvent)  => {
    const res: FromProducerMsg = e.data;
		console.log("onmessge: ", res);
		const type = res.type;
    switch (type) {
			case FromProducerMsgType.event:
				{
					const data = res.data;
					console.log("event:", data.subId, subId);
					if (data.subId === subId && observer) {
						observer(false, data);
					}
				}
				break;
			default:
				break;
		}
  };

  const onError = (error: any) => {
    if (observer) {
      console.debug(error.message);
      observer(true);
    }
  };

  port.addEventListener('message', onMessage);
  port.addEventListener('error', onError);

  const subscription: SubFilterResultStream = {
    next() {
      return new Promise<IteratorResult<SubFilterResultMsg>>((resolve: any, reject) => {
        observer = (done: boolean, value?: SubFilterResultMsg) => {
          if (done === true) {
            resolve({ value: undefined as any, done }); // Resolve with 'done: true' if 'done' flag is true
            return;
          }
          resolve({ value, done: false });
        };
      });
    },
    return(): Promise<IteratorResult<SubFilterResultMsg>> {
      return new Promise<IteratorResult<SubFilterResultMsg>>(resolve => {
        resolve({ value: undefined as any, done: true });
      });
    },
    throw(error) {
      return Promise.reject(error);
    },
    [Symbol.asyncIterator]() {
      return this;
    },
    unsubscribe() {
      observer = null;
      port.removeEventListener('message', onMessage);
      port.removeEventListener('error', onError);
    },
    id: subId,
  };

  return subscription;
}

export interface PubEventResultStream extends AsyncIterableIterator<PubEventResultMsg> {
  unsubscribe(): void;
	eventId: string;
}

export function createPubEventResultStream(
  port: MessagePort,
  eventId: EventId,
): PubEventResultStream {
  let observer: ((done: boolean, value?: PubEventResultMsg) => void) | null;

  const onMessage =  (e: MessageEvent)  => {
    const res: FromProducerMsg = e.data;
		const type = res.type;
    switch (type) {
			case FromProducerMsgType.pubResult:
				{
					const data = res.data;
					if (data.eventId === eventId && observer) {
						observer(false, data);
					}
				}
				break;
			default:
				break;
		}
  };

  const onError = (error: any) => {
    if (observer) {
      console.debug(error.message);
      observer(true);
    }
  };

  port.addEventListener('message', onMessage);
  port.addEventListener('error', onError);

  const subscription: PubEventResultStream = {
    next() {
      return new Promise<IteratorResult<PubEventResultMsg>>((resolve: any, reject) => {
        observer = (done: boolean, value?: PubEventResultMsg) => {
          if (done === true) {
            resolve({ value: undefined as any, done }); // Resolve with 'done: true' if 'done' flag is true
            return;
          }
          resolve({ value, done: false });
        };
      });
    },
    return(): Promise<IteratorResult<PubEventResultMsg>> {
      return new Promise<IteratorResult<PubEventResultMsg>>(resolve => {
        resolve({ value: undefined as any, done: true });
      });
    },
    throw(error) {
      return Promise.reject(error);
    },
    [Symbol.asyncIterator]() {
      return this;
    },
    unsubscribe() {
      observer = null;
      port.removeEventListener('message', onMessage);
      port.removeEventListener('error', onError);
    },
		eventId
  };

  return subscription;
}
