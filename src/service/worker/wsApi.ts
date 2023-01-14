import { WsApi } from 'service/api';
import { defaultRelays } from '../relay';

export enum ToWorkerMessageType {
  ADD_RELAY_URL = 'addRelayUrl',
  DISCONNECT = 'disconnect',
  CALL_API = 'execApiMethod',
}

export interface ToWorkerMessage {
  type: ToWorkerMessageType;
  urls?: string[];
  callMethod?: string;
  callData?: any[];
}

export enum FromWorkerMessageType {
  WS_CONN_STATUS = 'wsConnectStatus',
  NostrData = 'nostrData',
}

export interface FromWorkerMessage {
  type: FromWorkerMessageType;
  wsConnectStatus?: WsConnectStatus;
  nostrData?: any;
}

export type WsConnectStatus = Map<string, boolean>;

export class WsApiWorker {
  private connectedClients: MessagePort[] = [];
  private wsConnectStatus: WsConnectStatus = new Map();
  private wsApiList: WsApi[] = [];
  onPortConnect?: (port: MessagePort) => void;

  constructor(private relayUrls: string[]) {
    this.setupWebSocketApis();
    this.setupConnections();
  }

  private setupWebSocketApis() {
    this.relayUrls.forEach(relayUrl => {
      const onmessage = (event: MessageEvent) =>
        this.connectedClients.forEach(client => {
          const msg: FromWorkerMessage = {
            type: FromWorkerMessageType.NostrData,
            nostrData: event.data,
          };
          client.postMessage(msg);
        });
      const onerror = (event: Event) => {
        console.error(`WebSocket error: ${event}`);
        this.wsConnectStatus.set(relayUrl, false);
        this.sendWsConnectStatusUpdate();
      };
      const onclose = () => {
        console.log(`WebSocket connection to ${relayUrl} closed`);
        this.wsConnectStatus.set(relayUrl, false);
        this.sendWsConnectStatusUpdate();
      };

      if (!this.wsConnectStatus.has(relayUrl)) {
        const ws = new WsApi(relayUrl, {
          onOpenHandler: _event => {
            if (ws.isConnected() === true) {
              this.wsConnectStatus.set(relayUrl, true);
              console.log(`WebSocket connection to ${relayUrl} connected`);
              this.sendWsConnectStatusUpdate();
            }
          },
          onMsgHandler: onmessage,
          onCloseHandler: onclose,
          onErrHandler: onerror,
        });
        this.wsConnectStatus.set(relayUrl, false);
        this.wsApiList.push(ws);
      }
    });
  }

  private setupConnections() {
    globalThis.addEventListener('connect', (event: Event) => {
      console.log('detect!!');
      const port = (event as MessageEvent).ports[0];
      port.start();
      this.connectedClients.push(port);
      this.connectPort(port);

      port.onmessage = (messageEvent: MessageEvent) => {
        const message: ToWorkerMessage = messageEvent.data;

        switch (message.type) {
          case ToWorkerMessageType.ADD_RELAY_URL:
            if (message.urls) {
              message.urls.forEach(url => {
                if (!this.wsConnectStatus.has(url)) {
                  this.relayUrls.push(url);
                  this.setupWebSocketApis();
                }
              });
            }
            break;

          case ToWorkerMessageType.CALL_API:
            const callMethod = message.callMethod;
            const callData = message.callData || [];
            if (callMethod == null) {
              console.error('callMethod can not be null for CALL_API');
              return;
            }

            this.wsConnectStatus.forEach((connected, url) => {
              if (connected === true) {
                this.wsApiList
                  .filter(ws => ws.url() === url)
                  .map(ws => {
                    const method = ws[callMethod];
                    if (typeof method === 'function') {
                      method.apply(ws, ...callData);
                    } else {
                      console.error(`method ${callMethod} not found`);
                    }
                  });
              }
            });
            break;

          case ToWorkerMessageType.DISCONNECT:
            this.connectedClients = this.connectedClients.filter(
              client => client !== port,
            );
            port.close();
            if (
              this.connectedClients.length === 0 &&
              this.wsApiList.every(ws => ws.isClose())
            ) {
              this.wsApiList.forEach(ws => ws.close());
            }
            break;

          default:
            console.log('Invalid message type');
            break;
        }
      };
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

  private connectPort(port: MessagePort) {
    if (this.onPortConnect) this.onPortConnect(port);
  }

  public connect(onConnect: (port: MessagePort) => void) {
    globalThis.onconnect = (event: Event) => {
      const port = (event as MessageEvent).ports[0];
      onConnect(port);
    };
  }
}

export const wsApiWorker = new WsApiWorker(defaultRelays);
