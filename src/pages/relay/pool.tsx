import React, { useEffect, useState } from 'react';
import { Pool } from 'service/relay/pool';
import styles from './index.module.scss';
import { Button } from 'antd';
import WebSocketBenchmark from './benchmark';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { db } from 'service/relay/auto';

export function RelayPool() {
  const publicKey = useReadonlyMyPublicKey();
  const [relayPool, setRelayPool] = useState<Pool>();
  const [urls, setUrls] = useState<string[]>([]);
  const [fastest, setFastest] = useState<
    [
      string,
      {
        benchmark: number;
        isFailed: boolean;
      },
    ]
  >();
  const [isGetFastestLoading, setIsGetFastestLoading] = useState(false);
  const [autoRelays, setAutoRelays] = useState<string[]>([]);
  const [isGetAutoRelayLoading, setIsGetAutoRelayLoading] = useState(false);

  useEffect(() => {
    if (relayPool?.relays && relayPool.relays.length > 0) {
      setUrls(relayPool.relays.map(r => r.url));
    }
  }, [relayPool?.relays]);

  useEffect(() => {
    const relayPool = new Pool();
    relayPool.getAllRelays();
    setRelayPool(relayPool);
  }, []);

  const getFastest = async () => {
    if (relayPool?.relays) {
      setIsGetFastestLoading(true);
      const fastest = await Pool.getFastest(relayPool?.relays.map(r => r.url));
      setFastest(fastest);
      setIsGetFastestLoading(false);
    }
  };

  const getBestRelays = async () => {
    setIsGetAutoRelayLoading(true);
    if (relayPool?.relays) {
      await Pool.getBestRelay(
        relayPool?.relays.map(r => r.url),
        publicKey,
      );
      const relays = (await db.pick(publicKey)).slice(0, 6).map(i => i.relay);
      setAutoRelays(_prev => relays);
    }
    setIsGetAutoRelayLoading(false);
  };

  return (
    <div>
      <Button loading={isGetAutoRelayLoading} onClick={getBestRelays}>
        get auto relays
      </Button>
      {autoRelays.map(r => (
        <li key={r}>{r}</li>
      ))}
      <hr />
      <Button loading={isGetFastestLoading} onClick={getFastest}>
        get fastest
      </Button>
      {fastest && fastest?.[0]} {fastest?.[1].benchmark}ms{' '}
      {fastest?.[1].isFailed}
      <hr />
      <WebSocketBenchmark urls={urls} />
    </div>
  );
}
