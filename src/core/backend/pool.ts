import { randomSubId } from 'core/worker/util';
import { isEventSubResponse } from 'core/nostr/util';
import {
  EventSubResponse,
  Filter
} from 'core/nostr/type';
import { NodeWsApi } from './api';
import { CallRelayType, WsConnectStatus } from 'core/worker/type';
import { MessageEvent, ErrorEvent } from 'ws';
import { NostrFilterMessage } from './types';
import { WorkerEventEmitter } from 'core/worker/bus';

export const workerEventEmitter = new WorkerEventEmitter();

class GroupedAsyncGenerator<T, K> {
  private resolveFunctions = new Map<
    K,
    (value: IteratorResult<T, any>) => void
  >();

  constructor(private messageStream: () => AsyncGenerator<T>) {}

  async *getGenerator(key: K): AsyncGenerator<T, any, undefined> {
    while (true) {
      const { value, done } = await this.messageStream().next();

      const data = JSON.parse(value?.nostrData);
      const subscriptionId = data[1] as K;

			if (done) {
        this.resolveFunctions.get(subscriptionId)?.({
          value: undefined,
          done: true,
        });
        break;
      }

      if (subscriptionId === key) {
        yield value as unknown as T;
      }      
    }
  }
}

export class Pool {
  public wsConnectStatus: WsConnectStatus = new Map();
  private wsApiList: NodeWsApi[] = [];
  public maxSub: number;

  groupedEvents: GroupedAsyncGenerator<NostrFilterMessage, string>;

  constructor(private relayUrls: string[], maxSub = 10) {
    console.debug('init backend ws pool..');
    this.setupWebSocketApis();

    this.maxSub = maxSub;

    async function* messageStream(): AsyncGenerator<NostrFilterMessage> {
      while (true) {
        yield await new Promise<NostrFilterMessage>(resolve => {
          const listener = (data: NostrFilterMessage) => {
            resolve(data);

            // release the listener
            workerEventEmitter.removeListener('message', listener);
          };
          workerEventEmitter.addListener('message', listener);
        });
      }
    }
    this.groupedEvents = new GroupedAsyncGenerator<NostrFilterMessage, string>(
      messageStream,
    );
  }

	close(){
		this.wsApiList.filter(ws => ws.isConnected()).forEach(ws => ws.close());
	}

  private setupWebSocketApis() {
    this.relayUrls.forEach(relayUrl => {
      const onmessage = (event: MessageEvent) => {
        const msg: NostrFilterMessage = {
          nostrData: event.data.toString(),
          relayUrl,
        };
        workerEventEmitter.emit('message', msg);
      };
      const onerror = (event: ErrorEvent) => {
        console.error(`WebSocket error: `, event.message);
        this.wsConnectStatus.set(relayUrl, false);
      };
      const onclose = () => {
        if (this.wsConnectStatus.get(relayUrl) === true) {
          console.log(`WebSocket connection to ${relayUrl} closed`);
          this.wsConnectStatus.set(relayUrl, false);
        }
      };

      if (!this.wsConnectStatus.has(relayUrl)) {
        const ws = new NodeWsApi(
          relayUrl,
          {
            onOpenHandler: _event => {
              if (ws.isConnected() === true) {
                this.wsConnectStatus.set(relayUrl, true);
                console.log(`WebSocket connection to ${relayUrl} connected`);
              }
            },
            onMsgHandler: onmessage,
            onCloseHandler: onclose,
            onErrHandler: onerror,
          },
          this.maxSub,
          5,
        );
        this.wsConnectStatus.set(relayUrl, false);
        this.wsApiList.push(ws);
      }
    });
  }

  subFilter({ filter, customSubId }: { filter: Filter; customSubId?: string }) {
    const subscriptionId = customSubId || randomSubId();
    this.wsApiList
      .filter(ws => ws.isConnected())
      .forEach(ws => {
        ws.subFilter(filter, undefined, subscriptionId);
      });
    return {
      subscriptionId,
      getIterator: () => {
        return this.groupedEvents.getGenerator(subscriptionId);
      },
      iterating: ({ cb, onDone }) => {
        const iterator = this.groupedEvents.getGenerator(subscriptionId);

        (async () => {
          //await new Promise(resolve => setTimeout(resolve, 500));
          while (true) {
            const result = await iterator?.next();
            if (result?.done) {
              // todo: empty this.messageGroups[subscriptionId] value but not delete the key
              if (onDone) onDone();
              break;
            } else {
              const res = result?.value;
              if (res == null) continue;
              const msg = JSON.parse(res.nostrData); //todo: callback other datatype as well
              if (isEventSubResponse(msg)) {
                const event = (msg as EventSubResponse)[2];
                cb(event, res.relayUrl);
              }
            }
          }
        })();
      },
    };
  }

  callApi(message: {
    callRelayType?: CallRelayType;
    callRelayUrls?: string[];
    callMethod: string;
    callData: any[];
  }) {
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
            return urls.includes(ws.url);

          case CallRelayType.single:
            if (urls == null || urls.length !== 1)
              throw new Error(
                'callRelayUrls.length != 1 or is null for CallRelayType.single',
              );
            return urls[0] === ws.url;

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
            const customSubId = callData[2];
            const subId = customSubId || randomSubId();
            callData[2] = subId; // update with portId packed;
          }

          method.apply(ws, callData);
        } else {
          console.error(`method ${callMethod} not found`);
        }
      });
  }
}

