import React, { useEffect, useState } from 'react';
import { isEventSubResponse, EventSubResponse } from 'service/api';
import { CallWorker } from 'service/worker/callWorker';
import { FromWorkerMessageData, WsConnectStatus } from 'service/worker/type';

export const Test = () => {
  const [worker, setWorker] = useState<CallWorker>();
  const [wsConnectStatus, setWsConnectStatus] = useState<WsConnectStatus>(
    new Map(),
  );
  const [counter, setCounter] = useState<number>(0);
  const [sendCounter, setSendCounter] = useState<number>(0);

  useEffect(() => {
    const worker = new CallWorker(
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
        onMsgHandler(message.nostrData);
      },
      'homeIndex',
    );
    setWorker(worker);
    worker.pullWsConnectStatus();

    return () => {
      worker.removeListeners();
    };
  }, []);

  useEffect(() => {
    setSendCounter(sendCounter + 1);
  }, [worker, wsConnectStatus]);

  function onMsgHandler(res: any) {
    const msg = JSON.parse(res);
    if (isEventSubResponse(msg)) {
      console.log(msg);
      setCounter(counter + 1);
    }
  }

  return (
    <div>
      <p>sent message count: {sendCounter}</p>
      <p>receive message count: {counter}</p>
    </div>
  );
};
