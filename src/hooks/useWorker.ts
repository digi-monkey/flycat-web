import React, { useEffect, useState } from 'react';
import { equalMaps } from 'service/helper';
import { CallWorker } from 'service/worker/callWorker';
import { FromWorkerMessageData, WsConnectStatus } from 'service/worker/type';

export type OnMsgHandler = (this, nostrData: any, relayUrl?: string) => any;

export interface UseCallWorkerProps {
  onMsgHandler: OnMsgHandler;
  updateWorkerMsgListenerDeps: any[];
  workerAliasName?: string;
}

export function useCallWorker({
  onMsgHandler,
  updateWorkerMsgListenerDeps,
  workerAliasName,
}: UseCallWorkerProps) {
  const [newConn, setNewConn] = useState<string[]>([]);
  const [lastWsConnectStatus, setLastWsConnectStatus] =
    useState<WsConnectStatus>(new Map());
  const [wsConnectStatus, setWsConnectStatus] = useState<WsConnectStatus>(
    new Map(),
  );
  const [worker, setWorker] = useState<CallWorker>();

  useEffect(() => {
    const worker = new CallWorker(
      (message: FromWorkerMessageData) => {
        if (message.wsConnectStatus) {
          if (equalMaps(wsConnectStatus, message.wsConnectStatus)) {
            // no changed
            console.debug('[wsConnectStatus] same, not updating');
            return;
          }

          const data = Array.from(message.wsConnectStatus.entries());
          setWsConnectStatus(prev => {
            const newMap = new Map(prev);
            for (const d of data) {
              const relayUrl = d[0];
              const isConnected = d[1];
              if (
                newMap.get(relayUrl) &&
                newMap.get(relayUrl) === isConnected
              ) {
                continue; // no changed
              }

              newMap.set(relayUrl, isConnected);
            }

            return newMap;
          });
        }
      },
      (message: FromWorkerMessageData) => {
        onMsgHandler(message.nostrData, message.relayUrl);
      },
      workerAliasName || 'unnamedCallWorker',
    );
    setWorker(worker);
    worker.pullWsConnectStatus();
  }, []);

  useEffect(() => {
    if (worker == null) return;
    // update worker listener
    // update some deps like myPublicKey in the listener
    worker.updateMsgListener(
      (message: FromWorkerMessageData) => {
        if (message.wsConnectStatus) {
          const data = Array.from(message.wsConnectStatus.entries());
          for (const d of data) {
            setWsConnectStatus(prev => {
              const newMap = new Map(prev);
              newMap.set(d[0], d[1]);
              return newMap;
            });
          }
        }
      },
      (message: FromWorkerMessageData) => {
        onMsgHandler(message.nostrData, message.relayUrl);
      },
    );
  }, updateWorkerMsgListenerDeps);

  useEffect(() => {
    if (equalMaps(lastWsConnectStatus, wsConnectStatus)) {
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
