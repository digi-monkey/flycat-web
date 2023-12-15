import { Pool } from './pool';
import {
  FromConsumerMsg,
  FromConsumerMsgType,
  RelayInfoMsg,
  FromProducerMsgType,
  PubEventResultMsg,
  RelaySwitchAlertMsg,
  SubEndMsg,
} from './type';

// messaging between backend sharedWorker and frontpage caller
export const createPortOnMessageListener = ({
  pool,
  port,
  connectedPorts,
}: {
  pool: Pool;
  port: MessagePort;
  connectedPorts: (MessagePort | null)[];
}) => {
  return (event: MessageEvent) => {
    const res: FromConsumerMsg = event.data;
    const type = res.type;
    switch (type) {
      case FromConsumerMsgType.switchRelays:
        {
          console.log(
            'SWITCH_RELAYS',
            res.data.switchRelays,
            pool.switchRelays,
          );
          const data = res.data;
          if (data.switchRelays.relays.length === 0) return;
          if (data.switchRelays.id === pool.switchRelays.id)
            return console.log('no need to switch');

          pool.doSwitchRelays(data.switchRelays!);

          // post the alert to other ports
          const msg: RelaySwitchAlertMsg = {
            id: data.switchRelays.id,
            relays: data.switchRelays.relays,
            wsConnectStatus: pool.wsConnectStatus,
            triggerByPortId: data.portId,
          };
          connectedPorts
            .filter(p => p !== port && p != null)
            .forEach(p => {
              p?.postMessage({
                data: msg,
                type: FromProducerMsgType.relaySwitchedAlert,
              });
            });
        }
        break;

      case FromConsumerMsgType.pullRelayInfo:
        {
          console.log('PULL_RELAY_INFO');
          const data = res.data;
          const msg: RelayInfoMsg = {
            id: pool.switchRelays.id,
            relays: pool.switchRelays.relays,
            wsConnectStatus: pool.wsConnectStatus,
            portId: data.portId,
          };
          port.postMessage({
            data: msg,
            type: FromProducerMsgType.relayInfo,
          });
        }

        break;

      case FromConsumerMsgType.subFilter:
        {
          console.log('SUB_FILTER');
          const data = res.data;
          const subs = pool.subFilter(data);

          const promises = subs.map(
            sub =>
              new Promise(async resolve => {
                for await (const event of sub) {
                  const msg = {
                    event,
                    subId: sub.id,
                    relayUrl: sub.url,
                    portId: data.portId,
                  };
                  port.postMessage({
                    data: msg,
                    type: FromProducerMsgType.event,
                  });
                }
                sub.unsubscribe();
                resolve({
                  url: sub.url,
                  isEose: sub.isEose,
                  isIdleTimeout: sub.isIdleTimeout,
                });
              }),
          ) as Promise<{
            url: string;
            isEose: () => boolean;
            isIdleTimeout: () => boolean;
          }>[];

          Promise.all(promises).then(res => {
            const msg: SubEndMsg = {
              id: data.subId,
              portId: data.portId,
              eoseRelays: res.filter(r => r.isEose()).map(r => r.url),
              idleTimeoutRelays: res
                .filter(r => r.isIdleTimeout())
                .map(r => r.url),
            };
            port.postMessage({
              data: msg,
              type: FromProducerMsgType.subEnd,
            });
          });
        }
        break;

      case FromConsumerMsgType.pubEvent:
        {
          console.log('PUB EVENT');
          const data = res.data;
          const pubs = pool.pubEvent(data);
          pubs.forEach(async pub => {
            for await (const result of pub) {
              const msg: PubEventResultMsg = {
                isSuccess: result.isSuccess,
                reason: result.reason,
                relayUrl: result.relayUrl,
                portId: data.portId,
                eventId: data.event.id,
              };
              port.postMessage({
                data: msg,
                type: FromProducerMsgType.pubResult,
              });
            }
          });
        }
        break;

      case FromConsumerMsgType.disconnect:
        {
          console.log('DISCONNECT');
          pool.closeAll();
        }

        break;

      case FromConsumerMsgType.closePort:
        {
          console.log('CLOSE_PORT', res.data.portId);
          const data = res.data;
          connectedPorts[data.portId] = null;
          pool.closePort(data.portId);
        }
        break;

      default:
        break;
    }
  };
};
