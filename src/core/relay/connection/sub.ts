import { RelayResponse, RelayResponseType } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';

export interface SubscriptionDataStream extends AsyncIterableIterator<Event> {
  unsubscribe(): void;
  id: string;
}

export function createSubscriptionDataStream(
  webSocket: WebSocket,
  id: string,
): SubscriptionDataStream {
  let observer: ((done: boolean, value?: Event) => void) | null;

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
          observer(false, event);
        }
        break;
      }

      case RelayResponseType.SubReachEnd: {
        const subId = msg[1];
        if (subId === id && observer) {
          observer(true);
        }
        break;
      }

      default:
        break;
    }
  };
  webSocket.addEventListener('message', onMessage);

  webSocket.onerror = error => {
    // for (const observer of observers) {
    //   observer();
    // }
    if (observer) {
      observer(true);
    }
  };

  const subscription: SubscriptionDataStream = {
    next() {
      return new Promise<IteratorResult<Event>>((resolve: any, reject) => {
        observer = (done: boolean, value?: Event) => {
          if (done === true) {
            resolve({ value: undefined as any, done }); // Resolve with 'done: true' if 'done' flag is true
            return;
          }
          resolve({ value, done: false });
        };
      });
    },
    return(): Promise<IteratorResult<Event>> {
      return new Promise<IteratorResult<Event>>(resolve => {
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
    },
    id: id
  };

  return subscription;
}
