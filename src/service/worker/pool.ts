import { newSubId, randomSubId, SubscriptionId, WsApi } from 'service/api';
import { defaultRelays } from 'service/relay';
import { WorkerEventEmitter } from './bus';
import {
  CallRelayType,
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
  public maxKeepAliveSub: number;
  private portSubs: Map<number, SubscriptionId[]> = new Map(); // portId to keep-alive subIds

  constructor(private relayUrls: string[], maxSub = 10, maxKeepAliveSub = 2) {
    console.log('init Pool..');
    this.setupWebSocketApis();
    this.listen();

    this.maxSub = maxSub;
    this.maxKeepAliveSub = maxKeepAliveSub;
  }

  startMonitor() {
    setInterval(() => {
      console.debug(
        `portSubs(only keep-alive): ${this.portSubs.size}`,
        this.portSubs,
      );
      this.wsApiList
        .filter(ws => ws.isConnected())
        .forEach(ws => {
          console.debug(
            `${ws.url()} subs: total ${ws.subPoolLength()}, keep-alive ${
              ws.keepAlivePool.size
            }, instant ${ws.instantPool.size}`,
          );
        });
    }, 10 * 1000);
  }

  private setupWebSocketApis() {
    this.relayUrls.forEach(relayUrl => {
      const onmessage = (event: MessageEvent) => {
        const msg: FromWorkerMessageData = {
          nostrData: event.data,
          relayUrl,
        };
        workerEventEmitter.emit(FromWorkerMessageType.NOSTR_DATA, msg);
      };
      const onerror = (event: Event) => {
        console.error(`WebSocket error: `, event);
        this.wsConnectStatus.set(relayUrl, false);
      };
      const onclose = () => {
        if (this.wsConnectStatus.get(relayUrl) === true) {
          console.log(`WebSocket connection to ${relayUrl} closed`);
          this.wsConnectStatus.set(relayUrl, false);
          this.sendWsConnectStatusUpdate();
        }
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
          this.maxKeepAliveSub
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
        const portId = message.portId;
        const callRelayType = message.callRelayType;
        const urls = message.callRelayUrls;
        const callMethod = message.callMethod;
        const callData = message.callData || [];
        if (callMethod == null) {
          console.error('callMethod can not be null for CALL_API');
          return;
        }

        this.wsApiList
          .filter(ws => {
            switch (callRelayType) {
              case CallRelayType.all:
                return true;

              case CallRelayType.connected:
                return ws.isConnected();

              case CallRelayType.batch:
                if (urls == null)
                  throw new Error('null callRelayUrls for CallRelayType.batch');
                return urls.includes(ws.url());

              case CallRelayType.single:
                if (urls == null || urls.length !== 1)
                  throw new Error(
                    'callRelayUrls.length != 1 or is null for CallRelayType.single',
                  );
                return urls[0] === ws.url();

              default:
                return ws.isConnected();
            }
          })
          .map(ws => {
            const method = ws[callMethod];
            if (typeof method === 'function') {
              // record custom sub id to port id
              // todo: maybe also record non-keep-alive subscription id to portId
              if (callMethod === 'subFilter') {
                const keepAlive = callData[1];
                const customSubId = callData[2];
                const subId = newSubId(
                  message.portId,
                  customSubId || randomSubId(),
                );
                callData[2] = subId; // update with portId packed;
                if (keepAlive === true) {
                  const data = this.portSubs.get(portId);
                  if (data != null && !data.includes(subId)) {
                    data.push(subId);
                    this.portSubs.set(portId, data);
                  } else {
                    console.debug('create new portSub', portId);
                    this.portSubs.set(portId, [subId]);
                  }
                }
              }

              method.apply(ws, callData);
            } else {
              console.error(`method ${callMethod} not found`);
            }
          });
      },
    );

    workerEventEmitter.on(
      ToWorkerMessageType.DISCONNECT,
      (_message: ToWorkerMessageData) => {
        this.wsApiList.forEach(ws => ws.close());
      },
    );

    workerEventEmitter.on(
      ToWorkerMessageType.CLOSE_PORT,
      (message: ToWorkerMessageData) => {
        const portId = message.portId;
        const subIds = this.portSubs.get(portId);
        if (subIds && subIds.length > 0) {
          for (const id of subIds) {
            this.wsApiList
              .filter(ws => ws.isConnected())
              .forEach(ws => ws.killKeepAliveSub(id));
          }
        }
        this.portSubs.delete(portId);
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
export const addRelays = (relays: string[], portId: number) => {
  const msg: ToWorkerMessageData = {
    urls: relays,
    portId,
  };
  workerEventEmitter.emit(ToWorkerMessageType.ADD_RELAY_URL, msg);
};

export const pullRelayStatus = (portId: number) => {
  const msg: ToWorkerMessageData = { portId };
  workerEventEmitter.emit(ToWorkerMessageType.PULL_RELAY_STATUS, msg);
};

export const callApi = (
  callMethod: string,
  callData: any[],
  portId: number,
  callRelay?: {
    type?: CallRelayType;
    data?: string[];
  },
) => {
  const msg: ToWorkerMessageData = {
    callMethod,
    callData,
    callRelayType: callRelay?.type,
    callRelayUrls: callRelay?.data,
    portId,
  };
  workerEventEmitter.emit(ToWorkerMessageType.CALL_API, msg);
};

export const disconnect = (portId: number) => {
  const msg: ToWorkerMessageData = { portId };
  workerEventEmitter.emit(ToWorkerMessageType.DISCONNECT, msg);
};

export const closePort = (portId: number) => {
  const msg: ToWorkerMessageData = {
    portId,
  };
  workerEventEmitter.emit(ToWorkerMessageType.CLOSE_PORT, msg);
};

export const listenFromPool = async (
  onWsConnStatus?: (message: FromWorkerMessageData) => any,
  onNostrData?: (message: FromWorkerMessageData) => any,
) => {
  if (!!onWsConnStatus) {
    workerEventEmitter.on(FromWorkerMessageType.WS_CONN_STATUS, onWsConnStatus);
  }
  if (!!onNostrData) {
    workerEventEmitter.on(FromWorkerMessageType.NOSTR_DATA, onNostrData);
  }
};
