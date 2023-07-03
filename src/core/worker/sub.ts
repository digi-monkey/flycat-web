import {
  FromProducerMsg,
  FromProducerMsgType,
  PubEventResultMsg,
  SubEndMsg,
  SubFilterResultMsg,
} from './type';
import { EventId } from 'core/nostr/type';

export interface SubFilterResultStream
  extends AsyncIterableIterator<SubFilterResultMsg> {
  unsubscribe(): void;
  id: string;
  getSubEndMsg: () => SubEndMsg | null;
}

export function createSubFilterResultStream(
  port: MessagePort,
  subId: string,
  timeoutMs = 3000,
): SubFilterResultStream {
  let observer: ((done: boolean, value?: SubFilterResultMsg) => void) | null;
  let isFirstObservation = true;
  let timeout: number | null = null;
  let subEndMsg: SubEndMsg | null = null;

  const onMessage = (e: MessageEvent) => {
    const res: FromProducerMsg = e.data;
    const type = res.type;
    switch (type) {
      case FromProducerMsgType.event:
        {
          const data = res.data;
          if (data.subId === subId && observer) {
            if (isFirstObservation) {
              isFirstObservation = false;
            } else {
              clearTimeout(timeout!); // Clear the previous timeout
            }
            observer(false, data);
          }
        }
        break;

      case FromProducerMsgType.subEnd:
        {
          const data = res.data;
          if (data.id === subId && observer) {
            subEndMsg = data;
            observer(true);
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
      return new Promise<IteratorResult<SubFilterResultMsg>>(
        (resolve: any, reject) => {
          if (isFirstObservation) {
            observer = (done: boolean, value?: SubFilterResultMsg) => {
              if (done === true) {
                clearTimeout(timeout!); // Clear the timeout if the first observation is done
                resolve({ value: undefined as any, done }); // Resolve with 'done: true' if 'done' flag is true
                return;
              }
              isFirstObservation = false;
              resolve({ value, done: false });
            };
          } else {
            timeout = setTimeout(() => {
              if (observer) observer(true); // Trigger the observer with 'done: true' if timeout occurs
            }, timeoutMs); // Set the desired timeout value (in milliseconds)

            observer = (done: boolean, value?: SubFilterResultMsg) => {
              if (timeout) {
                clearTimeout(timeout);
              }
              if (done === true) {
                resolve({ value: undefined as any, done }); // Resolve with 'done: true' if 'done' flag is true
                return;
              }
              resolve({ value, done: false });
            };
          }
        },
      );
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
      timeout = null;
      port.removeEventListener('message', onMessage);
      port.removeEventListener('error', onError);
    },
    id: subId,
    getSubEndMsg: () => {
      return subEndMsg;
    },
  };

  return subscription;
}

export interface PubEventResultStream
  extends AsyncIterableIterator<PubEventResultMsg> {
  unsubscribe(): void;
  eventId: string;
}

export function createPubEventResultStream(
  port: MessagePort,
  eventId: EventId,
  timeoutMs = 3000,
): PubEventResultStream {
  let observer: ((done: boolean, value?: PubEventResultMsg) => void) | null;
  let isFirstObservation = true;
  let timeout: number | null = null;

  const onMessage = (e: MessageEvent) => {
    const res: FromProducerMsg = e.data;
    const type = res.type;
    switch (type) {
      case FromProducerMsgType.pubResult: {
        const data = res.data;
        if (data.eventId === eventId && observer) {
          if (isFirstObservation) {
            isFirstObservation = false;
          } else {
            clearTimeout(timeout!); // Clear the previous timeout
          }
          observer(false, data);
        }
        break;
      }
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
      return new Promise<IteratorResult<PubEventResultMsg>>(
        (resolve: any, reject) => {
          if (isFirstObservation) {
            observer = (done: boolean, value?: PubEventResultMsg) => {
              if (done === true) {
                clearTimeout(timeout!);
                resolve({ value: undefined as any, done });
                return;
              }
              isFirstObservation = false;
              resolve({ value, done: false });
            };
          } else {
            timeout = setTimeout(() => {
              if (observer) observer(true);
            }, timeoutMs);

            observer = (done: boolean, value?: PubEventResultMsg) => {
              if (timeout) {
                clearTimeout(timeout);
              }
              if (done === true) {
                resolve({ value: undefined as any, done });
                return;
              }
              resolve({ value, done: false });
            };
          }
        },
      );
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
      timeout = null;
      port.removeEventListener('message', onMessage);
      port.removeEventListener('error', onError);
    },
    eventId,
  };

  return subscription;
}
