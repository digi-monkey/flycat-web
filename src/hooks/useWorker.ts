import { useEffect, useState } from 'react';
import { CallWorker } from 'core/worker/caller';
import { WsConnectStatus } from 'core/worker/type';
import { isEqualMaps } from 'utils/validator';

export type OnMsgHandler = (this, nostrData: any, relayUrl?: string) => any;

export interface UseCallWorkerProps {
  workerAliasName?: string;
}

export function useCallWorker({ workerAliasName }: UseCallWorkerProps = {}) {
  const [newConn, setNewConn] = useState<string[]>([]);
  const [lastWsConnectStatus, setLastWsConnectStatus] =
    useState<WsConnectStatus>(new Map());
  const [wsConnectStatus, setWsConnectStatus] = useState<WsConnectStatus>(
    new Map(),
  );
  const [worker, setWorker] = useState<CallWorker>();

  useEffect(() => {
    const worker = new CallWorker((newWsConnectStatus: WsConnectStatus) => {
      setWsConnectStatus(prev => {
        if (isEqualMaps(prev, newWsConnectStatus)) {
          console.debug('[wsConnectStatus] same, not updating');
          return prev;
        }
        return newWsConnectStatus;
      });
    }, workerAliasName || 'unnamedCallWorker');
    setWorker(worker);
    worker.pullRelayInfo();
  }, []);

  useEffect(() => {
    if (isEqualMaps(lastWsConnectStatus, wsConnectStatus)) {
      return;
    }

    const newConn: string[] = Array.from(wsConnectStatus)
      .map(cur => {
        const url = cur[0];
        const isConnected = cur[1];
        if (
          lastWsConnectStatus.get(url) &&
          lastWsConnectStatus.get(url) === false &&
          isConnected === true
        ) {
          return url;
        }

        if (!lastWsConnectStatus.get(url) && isConnected) {
          return url;
        }

        return null;
      })
      .filter(s => s != null) as string[];
    setLastWsConnectStatus(wsConnectStatus);
    setNewConn(newConn);
  }, [wsConnectStatus]);

  return {
    worker,
    wsConnectStatus,
    newConn,
  };
}
