import { SubscriptionId } from 'core/nostr/type';
import {
  CallRelayType,
  PubEventMsg,
  SubFilterMsg,
  SwitchRelays,
  WsConnectStatus,
} from './type';
import { WS } from 'core/api/ws';

export class Pool {
  private wsList: WS[] = [];
  private portSubs: Map<number, SubscriptionId[]> = new Map(); // portId to keep-alive subIds

  public wsConnectStatus: WsConnectStatus = new Map();
  public onWsConnectStatusChange: (wsConnectStatus: WsConnectStatus)=>any; 
  public maxSub: number;
  public switchRelays: SwitchRelays;

  constructor(seedRelays: SwitchRelays, onWsConnectStatusChange: (wsConnectStatus: WsConnectStatus)=>any, maxSub = 10) {
    console.log('init Pool..');

    this.maxSub = maxSub;
    this.switchRelays = seedRelays;
    this.onWsConnectStatusChange = onWsConnectStatusChange;

    this.setupWebSocketApis();
  }

  startMonitor() {
    setInterval(() => {
      console.debug(`portSubs: ${this.portSubs.size}`, this.portSubs);
      this.wsList
        .filter(ws => ws.isConnected())
        .forEach(ws => {
          console.debug(
            `${
              ws.url
            } subs: active ${ws.activeSubscriptions.getSize()}, pending ${ws.pendingSubscriptions.size()}`,
          );
        });
    }, 1 * 1000);
  }

  closeAll() {
    for (const ws of this.wsList) {
      ws.close();
    }
    this.wsList = [];
    this.wsConnectStatus.clear();
  }

  setupWebSocketApis() {
    this.switchRelays.relays
      .map(r => r.url)
      .forEach(relayUrl => {
        if (!this.wsConnectStatus.has(relayUrl)) {
          const onOpen = _event => {
            if (ws.isConnected() === true) {
              this.wsConnectStatus.set(relayUrl, true);
              console.log(`WebSocket connection to ${relayUrl} connected`);
              this.onWsConnectStatusChange(this.wsConnectStatus);
            }
          };
          const onerror = (event: globalThis.Event) => {
            console.error(`WebSocket error: `, event);
            this.wsConnectStatus.set(relayUrl, false);
            this.onWsConnectStatusChange(this.wsConnectStatus);
          };
          const onclose = () => {
            if (this.wsConnectStatus.get(relayUrl) === true) {
              console.log(`WebSocket connection to ${relayUrl} closed`);
              this.wsConnectStatus.set(relayUrl, false);
              this.onWsConnectStatusChange(this.wsConnectStatus);
            }
          };

          const ws = new WS(relayUrl, this.maxSub, true);
          ws.onOpen(onOpen);
          ws.onError(onerror);
          ws.addCloseListener(onclose);

          this.wsConnectStatus.set(relayUrl, ws.isConnected());
          this.wsList.push(ws);
        }
      });
  }

  doSwitchRelays(switchRelays: SwitchRelays) {
    this.closeAll();
    this.switchRelays = switchRelays;
    this.setupWebSocketApis();
  }

  subFilter(message: SubFilterMsg) {
    const portId = message.portId;
    const callRelayType = message.callRelay.type;
    const urls = message.callRelay.data;
    const subId = message.subId;
    const filter = message.filter;

    const relays = this.wsList.filter(ws => {
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
    });
    return relays.map(ws => {
      const filterSubId = subId;
      const data = this.portSubs.get(portId);
      if (data != null && !data.includes(filterSubId)) {
        data.push(filterSubId);
        this.portSubs.set(portId, data);
      } else {
        this.portSubs.set(portId, [filterSubId]);
      }

      return ws.subFilter(filter, filterSubId);
    });
  }

  pubEvent(message: PubEventMsg) {
    const portId = message.portId;
    const callRelayType = message.callRelay.type;
    const urls = message.callRelay.data;
    const event = message.event;

    return this.wsList
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
        return ws.pubEvent(event);
      });
  }
}
