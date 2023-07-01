/* eslint-disable no-restricted-globals */
import { FromProducerMsg, FromProducerMsgType, RelayInfoMsg } from './type';
import { Pool } from './pool';
import { seedRelays } from 'core/relay/pool/seed';
import { createPortOnMessageListener } from './message';

/**
 * the worker and callWorker (1-to-many) are communicating through SharedWorker
 * while the worker and Pool(ws manager) instance (1-to-1) are communicating through eventEmitter
 */

const connectedPorts: (MessagePort | null)[] = [];

const pool = new Pool(
  {
    id: 'default',
    relays: seedRelays.map(url => {
      return { url, read: true, write: true };
    }),
  },
  wsConnectStatus => {
    connectedPorts.forEach((port, index) => {
      const msg: RelayInfoMsg = {
        id: pool.switchRelays.id,
        relays: pool.switchRelays.relays,
        wsConnectStatus,
        portId: index,
      };
      port?.postMessage({
        data: msg,
        type: FromProducerMsgType.relayInfo,
      });
    });
  },
);

self.onconnect = (evt: MessageEvent) => {
  const port = evt.ports[0];
  port.start();
  port.onmessage = createPortOnMessageListener({ pool, port, connectedPorts });
  connectedPorts.push(port);

  // post the portId to callWorker
  const msg: FromProducerMsg = {
    type: FromProducerMsgType.portId,
    data: {
      portId: connectedPorts.length - 1,
    },
  };
  port.postMessage(msg);
};

self.addEventListener('disconnect', e => {
  // todo: seems not triggering?
  console.log('port disconnected', e);
});

setInterval(() => {
  console.debug(
    `Ports: total ${connectedPorts.length}, connected ${
      connectedPorts.filter(p => p != null).length
    }`,
  );
}, 10 * 1000);

pool.startMonitor();

export {};
