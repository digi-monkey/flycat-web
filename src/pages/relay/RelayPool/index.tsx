import React, { useEffect, useState } from 'react';
import { Pool } from 'service/relay/pool';
import RelayPoolTable from './table';

export function RelayPool() {
  const [relayPool, setRelayPool] = useState<Pool>();

  useEffect(() => {
    const relayPool = new Pool();
    relayPool.getAllRelays();
    setRelayPool(relayPool);
  }, []);

  return (
    <div>
      <RelayPoolTable relays={relayPool?.relays || []}/>
    </div>
  );
}
