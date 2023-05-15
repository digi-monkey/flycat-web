import React, { useEffect, useState } from 'react';
import { Pool } from 'service/relay/pool';
import styles from './index.module.scss';
import { Button } from 'antd';

export function RelayPool() {
  const [relayPool, setRelayPool] = useState<Pool>();
  const [showPool, setShowPool] = useState(false);

  useEffect(() => {
    const relayPool = new Pool();
    relayPool.fetch();
    setRelayPool(relayPool);
  }, []);

  const benchmark = async () => {
    // todo: this does not update ui immediately
    await relayPool?.benchmark();
  };

  return (
    <div>
      <Button onClick={() => setShowPool(!showPool)}>show all relays from pool</Button>
      <div className={styles.pool} hidden={!showPool}>
        {relayPool?.relays.length}
        {' relays '}
        <button onClick={benchmark}>benchmark</button>
        {relayPool?.relays.map(r => (
          <li key={r.url}>
            {r.url}: {r.benchmark}ms
          </li>
        ))}
      </div>
    </div>
  );
}
