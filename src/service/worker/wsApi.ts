import EventEmitter from 'events';
import { WsApi } from 'service/api';
import { defaultRelays } from '../relay';

export class WorkerEventEmitter extends EventEmitter {}

export const workerEventEmitter = new WorkerEventEmitter();

export enum ToWorkerMessageType {
  ADD_RELAY_URL = 'addRelayUrl',
  DISCONNECT = 'disconnect',
  CALL_API = 'execApiMethod',
}

export interface ToWorkerMessage {
  urls?: string[];
  callMethod?: string;
  callData?: any[];
}

export enum FromWorkerMessageType {
  WS_CONN_STATUS = 'wsConnectStatus',
  NostrData = 'nostrData',
}

export interface FromWorkerMessage {
  wsConnectStatus?: WsConnectStatus;
  nostrData?: any;
}

export type WsConnectStatus = Map<string, boolean>;

export class WsApiWorker {
  private wsConnectStatus: WsConnectStatus = new Map();
  private wsApiList: WsApi[] = [];

  constructor(private relayUrls: string[]) {
    this.setupWebSocketApis();
    this.listen();
  }

  private setupWebSocketApis() {
    this.relayUrls.forEach(relayUrl => {
      const onmessage = (event: MessageEvent) => {
        const msg: FromWorkerMessage = {
          nostrData: event.data,
        };
        workerEventEmitter.emit(FromWorkerMessageType.NostrData, msg);
      };
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

  private listen() {
    workerEventEmitter.on(
      ToWorkerMessageType.ADD_RELAY_URL,
      (message: ToWorkerMessage) => {
        if (message.urls) {
          message.urls.forEach(url => {
            if (!this.wsConnectStatus.has(url)) {
              this.relayUrls.push(url);
              this.setupWebSocketApis();
            }
          });
        }
      },
    );

    workerEventEmitter.on(
      ToWorkerMessageType.CALL_API,
      (message: ToWorkerMessage) => {
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
                  method.apply(ws, callData);
                } else {
                  console.error(`method ${callMethod} not found`);
                }
              });
          }
        });
      },
    );

    workerEventEmitter.on(
      ToWorkerMessageType.DISCONNECT,
      (message: ToWorkerMessage) => {
        if (this.wsApiList.every(ws => ws.isClose())) {
          this.wsApiList.forEach(ws => ws.close());
        }
      },
    );
  }

  private sendWsConnectStatusUpdate() {
    const msg: FromWorkerMessage = {
      wsConnectStatus: this.wsConnectStatus,
    };
    workerEventEmitter.emit(FromWorkerMessageType.WS_CONN_STATUS, msg);
  }
}

export const wsApiWorker = new WsApiWorker(defaultRelays);
