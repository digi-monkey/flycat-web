import { randomSubId } from 'service/api/ws';
import { ClientRequestType, EventPubRequest, EventSubRequest, Filter } from 'service/nostr/type';
import { Event } from 'service/nostr/Event';
import { SubscriptionDataStream, createSubscriptionDataStream } from "./sub";

export class WS {
	private _ws: WebSocket;
	public  url: string;

	constructor(urlOrWebsocket: string | WebSocket){
    if(typeof urlOrWebsocket === "string"){
      this.url = urlOrWebsocket;
		  this._ws = new WebSocket(urlOrWebsocket);
    }else{
      this.url = urlOrWebsocket.url;
      this._ws = urlOrWebsocket;
    }
		
	}

	// todo: change to async and get pub response
	pubEvent(event: Event) {
    const data: EventPubRequest = [ClientRequestType.PubEvent, event];
    return this._send(JSON.stringify(data));
  }

  subFilter(filter: Filter, _subId?: string) {
    const subId = _subId || randomSubId();
		const data: EventSubRequest = [
			ClientRequestType.SubFilter,
			subId,
			filter,
		];

		try {
			this._send(JSON.stringify(data));
			return createSubscriptionDataStream(this._ws, subId);
		} catch (error: any) {
			throw new Error(error.message);
		}
  }

	_send(data: string | ArrayBuffer) {
    if (this.isConnected()) {
      this._ws.send(data);
    } else {
      throw new Error(
        `${this.url} not open, abort send msg.., ws.readState: ${
          this._ws.readyState
        }`,
      );
    }
  }

	isConnected() {
    if (this._ws == null) return false;

    if (this._ws.readyState === WebSocket.OPEN) {
      return true;
    } else {
      return false;
    }
  }

	isClose() {
    if (this._ws == null) return false;

    if (this._ws.readyState === WebSocket.CLOSED) {
      return true;
    } else {
      return false;
    }
  }

  close() {
    this._ws.onclose = null;
    this._ws.close();
  }
}
