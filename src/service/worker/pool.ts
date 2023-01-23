import { WsApi } from 'service/api';
import { defaultRelays } from 'service/relay';
import { WorkerEventEmitter } from './bus';
import {
  FromWorkerMessageData,
  FromWorkerMessageType,
  ToWorkerMessageData,
  ToWorkerMessageType,
  WsConnectStatus,
} from './type';

export const workerEventEmitter = new WorkerEventEmitter();

export class Pool {
  private wsConnectStatus: WsConnectStatus = new Map();
  private wsApiList: WsApi[] = [];
  public maxSub: number;

  constructor(private relayUrls: string[], maxSub: number = 10) {
    console.log('init Pool..');
    this.setupWebSocketApis();
    this.listen();

    this.maxSub = maxSub;
  }

  private setupWebSocketApis() {
    this.relayUrls.forEach(relayUrl => {
      const onmessage = (event: MessageEvent) => {
        const msg: FromWorkerMessageData = {
          nostrData: event.data,
        };
        workerEventEmitter.emit(FromWorkerMessageType.NostrData, msg);
      };
      const onerror = (event: Event) => {
        console.error(`WebSocket error: `, event);
        this.wsConnectStatus.set(relayUrl, false);
        this.sendWsConnectStatusUpdate();
      };
      const onclose = () => {
        console.log(`WebSocket connection to ${relayUrl} closed`);
        this.wsConnectStatus.set(relayUrl, false);
        this.sendWsConnectStatusUpdate();
      };

      if (!this.wsConnectStatus.has(relayUrl)) {
        const ws = new WsApi(
          relayUrl,
          {
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
          },
          this.maxSub,
        );
        this.wsConnectStatus.set(relayUrl, false);
        this.wsApiList.push(ws);
      }
    });
  }

  private listen() {
    workerEventEmitter.on(
      ToWorkerMessageType.ADD_RELAY_URL,
      (message: ToWorkerMessageData) => {
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
      ToWorkerMessageType.PULL_RELAY_STATUS,
      (_message: ToWorkerMessageData) => {
        this.sendWsConnectStatusUpdate();
      },
    );

    workerEventEmitter.on(
      ToWorkerMessageType.CALL_API,
      (message: ToWorkerMessageData) => {
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
      (_message: ToWorkerMessageData) => {
        if (this.wsApiList.every(ws => ws.isClose())) {
          this.wsApiList.forEach(ws => ws.close());
        }
      },
    );
  }

  private sendWsConnectStatusUpdate() {
    const msg: FromWorkerMessageData = {
      wsConnectStatus: this.wsConnectStatus,
    };
    workerEventEmitter.emit(FromWorkerMessageType.WS_CONN_STATUS, msg);
  }
}

export const pool = new Pool(defaultRelays);

/*** helper functions */
export const addRelays = (relays: string[]) => {
  const msg: ToWorkerMessageData = {
    urls: relays,
  };
  workerEventEmitter.emit(ToWorkerMessageType.ADD_RELAY_URL, msg);
};

export const pullRelayStatus = () => {
  const msg: ToWorkerMessageData = {};
  workerEventEmitter.emit(ToWorkerMessageType.PULL_RELAY_STATUS, msg);
};

export const callApi = (callMethod: string, callData: any[]) => {
  const msg: ToWorkerMessageData = {
    callMethod,
    callData,
  };
  workerEventEmitter.emit(ToWorkerMessageType.CALL_API, msg);
};

export const disconnect = () => {
  const msg: ToWorkerMessageData = {};
  workerEventEmitter.emit(ToWorkerMessageType.DISCONNECT, msg);
};

export const listenFromPool = async (
  onWsConnStatus?: (message: FromWorkerMessageData) => any,
  onNostrData?: (message: FromWorkerMessageData) => any,
) => {
  if (!!onWsConnStatus) {
    workerEventEmitter.on(FromWorkerMessageType.WS_CONN_STATUS, onWsConnStatus);
  }
  if (!!onNostrData) {
    workerEventEmitter.on(FromWorkerMessageType.NostrData, onNostrData);
  }
};
