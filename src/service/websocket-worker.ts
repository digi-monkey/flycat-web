import { defaultRelays } from './relay';

export enum ToWorkerMessageType {
  ADD_RELAY_URL = 'addRelayUrl',
  DISCONNECT = 'disconnect',
}

export interface ToWorkerMessage {
  type: ToWorkerMessageType;
  urls?: string[];
}

export enum FromWorkerMessageType {
  WS_CONN_STATUS = 'wsConnectStatus',
  NostrData = 'nostrData',
}

export interface FromWorkerMessage {
  type: FromWorkerMessageType;
  wsConnectStatus?: WsConnectStatus;
  data?: any;
}

export type WsConnectStatus = Map<string, boolean>;

export class WebSocketWorker {
  private connectedClients: MessagePort[] = [];
  private wsConnectStatus: WsConnectStatus = new Map();
  private wsList: WebSocket[] = [];

  constructor(private relayUrls: string[]) {
    this.setupWebSockets();
    this.setupConnections();
  }

  private setupWebSockets() {
    this.relayUrls.forEach(relayUrl => {
      if (!this.wsConnectStatus.has(relayUrl)) {
        const ws = new WebSocket(relayUrl);
        this.wsConnectStatus.set(relayUrl, false);
        this.wsList.push(ws);
        ws.onopen = () => {
          this.wsConnectStatus.set(relayUrl, true);
          console.log(`WebSocket connection to ${relayUrl} opened`);
          this.sendWsConnectStatusUpdate();
        };
        ws.onmessage = (event: MessageEvent) =>
          this.connectedClients.forEach(client => {
            const msg: FromWorkerMessage = {
              type: FromWorkerMessageType.NostrData,
              data: event.data,
            };
            client.postMessage(msg);
          });
        ws.onerror = (event: Event) => {
          console.error(`WebSocket error: ${event}`);
          this.wsConnectStatus.set(relayUrl, false);
          this.sendWsConnectStatusUpdate();
        };
        ws.onclose = () => {
          console.log(`WebSocket connection to ${relayUrl} closed`);
          this.wsConnectStatus.set(relayUrl, false);
          this.sendWsConnectStatusUpdate();
        };
      }
    });
  }

  private setupConnections() {
    globalThis.addEventListener('connect', (event: Event) => {
      const port = (event as MessageEvent).ports[0];
      port.start();
      this.connectedClients.push(port);

      port.onmessage = (messageEvent: MessageEvent) => {
        const message: ToWorkerMessage = messageEvent.data;

        switch (message.type) {
          case ToWorkerMessageType.ADD_RELAY_URL:
            if (message.urls) {
              message.urls.forEach(url => {
                if (!this.wsConnectStatus.has(url)) {
                  this.relayUrls.push(url);
                  this.setupWebSockets();
                }
              });
            }
            break;
          case ToWorkerMessageType.DISCONNECT:
            this.connectedClients = this.connectedClients.filter(
              client => client !== port,
            );
            port.close();
            if (
              this.connectedClients.length === 0 &&
              this.wsList.every(ws => ws.readyState === WebSocket.CLOSED)
            ) {
              this.wsList.forEach(ws => ws.close());
            }
            break;
          default:
            console.log('Invalid message type');
            break;
        }
      };

      this.sendWsConnectStatusUpdate();
    });
  }

  private sendWsConnectStatusUpdate() {
    this.connectedClients.forEach(client => {
      const msg: FromWorkerMessage = {
        type: FromWorkerMessageType.WS_CONN_STATUS,
        wsConnectStatus: this.wsConnectStatus,
      };
      client.postMessage(msg);
    });
  }
}

export const webSocketWorker = new WebSocketWorker(defaultRelays);
