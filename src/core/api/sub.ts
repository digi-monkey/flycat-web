import {
  AuthSubResponse,
  Challenge,
  ClientRequestType,
  ErrorReason,
  EventId,
  EventPubResponse,
  EventPubResult,
  NoticeResponse,
  RelayResponse,
  RelayResponseType,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';

export interface SubscriptionEventStream extends AsyncIterableIterator<Event> {
  unsubscribe(): void;
  id: string;
  url: string;
  isEose: ()=>boolean;
  isIdleTimeout: ()=>boolean;
}

export interface SubscriptionNoticeStream
  extends AsyncIterableIterator<ErrorReason> {
  unsubscribe(): void;
}

export interface PublishEventResultStream
  extends AsyncIterableIterator<EventPubResult> {
  unsubscribe(): void;
  eventId: EventId;
}

export interface AuthStream extends AsyncIterableIterator<Challenge> {
  unsubscribe(): void;
}

export function createSubscriptionEventStream(
  webSocket: WebSocket,
  id: string,
  unsubscribeCb?: (id: string) => any,
  timeoutMs = 3000
): SubscriptionEventStream {
  let observer: ((done: boolean, value?: Event) => void) | null;
  let isFirstObservation = true;
  let timeout: number | null = null;
  let isEose = false;
  let isIdleTimeout = false; // todo: there should a total timeout too, but it needs to start after subscription is entered the active subs pool

  const onMessage = event => {
    const msg: RelayResponse = JSON.parse(event.data);
    const type = msg[0];
    switch (type) {
      case RelayResponseType.Notice:
        break;

      case RelayResponseType.PubEvent:
        break;

      case RelayResponseType.SubAuth:
        break;

      case RelayResponseType.SubEvent: {
        const subId = msg[1];
        const event = msg[2];
        if (subId === id && observer) {
          if (isFirstObservation) {
            isFirstObservation = false;
          } else {
            clearTimeout(timeout!); // Clear the previous timeout
          }
          observer(false, event);
        }
        break;
      }

      case RelayResponseType.SubReachEnd: {
        const subId = msg[1];
        if (subId === id && observer) {
          isEose = true;
          observer(true);
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

  webSocket.addEventListener('message', onMessage);
  webSocket.addEventListener('error', onError);

  const subscription: SubscriptionEventStream = {
    next() {
      return new Promise<IteratorResult<Event>>((resolve: any, reject) => {
        if (isFirstObservation) {
          observer = (done: boolean, value?: Event) => {
            if (done === true) {
              clearTimeout(timeout!); // Clear the timeout if the first observation is done
              resolve({ value: undefined as any, done }); // Resolve with 'done: true' if 'done' flag is true
              return;
            }
            isFirstObservation = false;
            resolve({ value, done: false });
          };
        }else{
        timeout = setTimeout(() => {
          if (observer) {
            isIdleTimeout = true;
            observer(true);
          } // Trigger the observer with 'done: true' if timeout occurs
        }, timeoutMs); // Set the desired timeout value (in milliseconds)

        observer = (done: boolean, value?: Event) => {
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
      });
    },
    return(): Promise<IteratorResult<Event>> {
      return new Promise<IteratorResult<Event>>(resolve => {
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
      webSocket.send(JSON.stringify([ClientRequestType.Close, id]));
      webSocket.removeEventListener('message', onMessage);
      webSocket.removeEventListener('error', onError);
      if(unsubscribeCb){
        unsubscribeCb(id);
      }
    },
    id: id,
    url: webSocket.url,
    isEose: ()=>{return isEose},
    isIdleTimeout: ()=>{return isIdleTimeout},
  };

  return subscription;
}

export function createSubscriptionNoticeStream(
  webSocket: WebSocket,
): SubscriptionNoticeStream {
  let observer: ((done: boolean, value?: ErrorReason) => void) | null;

  const onMessage = event => {
    const msg: RelayResponse = JSON.parse(event.data);
    const type = msg[0];
    switch (type) {
      case RelayResponseType.Notice:
        const reason = (msg as NoticeResponse)[1];
        if (observer) {
          observer(false, reason);
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

  webSocket.addEventListener('message', onMessage);
  webSocket.addEventListener('error', onError);

  const subscription: SubscriptionNoticeStream = {
    next() {
      return new Promise<IteratorResult<ErrorReason>>(
        (resolve: any, reject) => {
          observer = (done: boolean, value?: ErrorReason) => {
            if (done === true) {
              resolve({ value: undefined as any, done }); // Resolve with 'done: true' if 'done' flag is true
              return;
            }
            resolve({ value, done: false });
          };
        },
      );
    },
    return(): Promise<IteratorResult<ErrorReason>> {
      return new Promise<IteratorResult<ErrorReason>>(resolve => {
        // webSocket.close();
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
      webSocket.removeEventListener('message', onMessage);
      webSocket.removeEventListener('error', onError);
    },
  };

  return subscription;
}

// todo: pass the timeout result too before observer(true)
export function createPublishEventResultStream(
  webSocket: WebSocket,
  eventId: string,
): PublishEventResultStream {
  let observer: ((done: boolean, value?: EventPubResult) => void) | null;

  const onMessage = event => {
    const msg: RelayResponse = JSON.parse(event.data);
    const type = msg[0];
    switch (type) {
      case RelayResponseType.PubEvent:
        const _eventId = (msg as EventPubResponse)[1];
        const isSuccess = (msg as EventPubResponse)[2];
        const reason = (msg as EventPubResponse)[3];

        if (_eventId === eventId && observer) {
          const result: EventPubResult = {
            isSuccess,
            reason,
            relayUrl: webSocket.url
          };
          observer(false, result);
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

  webSocket.addEventListener('message', onMessage);
  webSocket.addEventListener('error', onError);

  const subscription: PublishEventResultStream = {
    next() {
      return new Promise<IteratorResult<EventPubResult>>(
        (resolve: any, reject) => {
          observer = (done: boolean, value?: EventPubResult) => {
            if (done === true) {
              resolve({ value: undefined as any, done }); // Resolve with 'done: true' if 'done' flag is true
              return;
            }
            resolve({ value, done: false });
          };
        },
      );
    },
    return(): Promise<IteratorResult<EventPubResult>> {
      return new Promise<IteratorResult<EventPubResult>>(resolve => {
        // webSocket.close();
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
      webSocket.removeEventListener('message', onMessage);
      webSocket.removeEventListener('error', onError);
    },
    eventId: eventId,
  };

  return subscription;
}

export function createAuthStream(
  webSocket: WebSocket,
): AuthStream {
  let observer: ((done: boolean, value?: Challenge) => void) | null;

  const onMessage = event => {
    const msg: RelayResponse = JSON.parse(event.data);
    const type = msg[0];
    switch (type) {
      case RelayResponseType.SubAuth:
        const challenge = (msg as AuthSubResponse)[1];
        if (observer) {
          observer(false, challenge);
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

  webSocket.addEventListener('message', onMessage);
  webSocket.addEventListener('error', onError);

  const subscription: AuthStream = {
    next() {
      return new Promise<IteratorResult<Challenge>>((resolve: any, reject) => {
        observer = (done: boolean, value?: Challenge) => {
          if (done === true) {
            resolve({ value: undefined as any, done }); // Resolve with 'done: true' if 'done' flag is true
            return;
          }
          resolve({ value, done: false });
        };
      });
    },
    return(): Promise<IteratorResult<Challenge>> {
      return new Promise<IteratorResult<Challenge>>(resolve => {
        // webSocket.close();
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
      webSocket.removeEventListener('message', onMessage);
      webSocket.removeEventListener('error', onError);
    },
  };

  return subscription;
}
