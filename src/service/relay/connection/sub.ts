import { RelayResponse, RelayResponseType } from 'service/nostr/type';
import { Event } from 'service/nostr/Event';

export interface Subscription {
	ws: WebSocket;
	id: string;
	isEos: boolean;
	dataStream: SubscriptionDataStream;
	unsubscribe: () => any;
}

export class Sub implements Subscription {
	ws: WebSocket;
	id: string;
	isEos = false;
	dataStream: SubscriptionDataStream;

	constructor(wsOrUrl: WebSocket | string, id: string){
		if(typeof wsOrUrl === "string"){
			this.ws = new WebSocket(wsOrUrl);
		}else{
			this.ws = wsOrUrl;
		}
		this.id = id;

		this.dataStream = this.createSubscriptionDataStream();
	}

	unsubscribe(){
		return this.dataStream.unsubscribe();
	}

  private createSubscriptionDataStream(): SubscriptionDataStream {
    const that = this;
    let observer: ((value: Event) => void) | null = null;
  
    this.ws.onmessage = (event) => {
      const msg: RelayResponse = JSON.parse(event.data);
      const type = msg[0];
      switch (type) {
        case RelayResponseType.Notice:
         
          break;
  
        case RelayResponseType.PubEvent:
          break;
  
        case RelayResponseType.SubAuth:
          break;
  
        case RelayResponseType.SubEvent:{
          const subId = msg[1];
          const event = msg[2];
          if (subId === this.id && observer) {
            observer(event);
          }
          break;
        }
  
        case RelayResponseType.SubReachEnd:{
          const subId = msg[1];
          if (subId === this.id) {
            this.isEos = true;
          }
          break;
        }
  
        default:
          break;
      }
    };
  
    this.ws.onerror = (error) => {
      // for (const observer of observers) {
      //   observer();
      // }
    };
  
    const subscription: SubscriptionDataStream = {
      next() {
        return new Promise<IteratorResult<Event>>((resolve, reject) => {
          if (that.isEos) {
            resolve({ value: undefined as any, done: true }); // Resolve with 'done: true' if 'done' flag is true
            return;
          }
  
          observer = (value: Event) => {
            observer = null; // Reset the observer after it's called
            resolve({ value, done: false });
          };
  
        });
      },
      return(): Promise<IteratorResult<Event>> {
        return new Promise<IteratorResult<Event>>((resolve) => {
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
        observer = null; // Reset the observer when unsubscribing
      }
    };
  
    return subscription;
  }
}

export interface SubscriptionDataStream extends AsyncIterableIterator<Event> {
  unsubscribe(): void;
}

export function createSubscriptionDataStream(webSocket: WebSocket, id: string): SubscriptionDataStream {
  let observer: ((done: boolean, value?: Event) => void) | null;
  const done = false;

  webSocket.onmessage = (event) => {
    const msg: RelayResponse = JSON.parse(event.data);
    const type = msg[0];
    switch (type) {
      case RelayResponseType.Notice:
       
        break;

      case RelayResponseType.PubEvent:
        break;

      case RelayResponseType.SubAuth:
        break;

      case RelayResponseType.SubEvent:{
        const subId = msg[1];
        const event = msg[2];
        if (subId === id && observer) {
          observer(false, event); 
        }
        break;
      }

      case RelayResponseType.SubReachEnd:{
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

  webSocket.onerror = (error) => {
    // for (const observer of observers) {
    //   observer();
    // }
    if(observer){
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
      return new Promise<IteratorResult<Event>>((resolve) => {
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
		}
  };

  return subscription;
}


