import React, { useEffect, useState } from 'react';
import { RelayPool } from 'service/relay/pool';
import RelayPoolTable from './table';
import { Button } from 'antd';
import { seedRelays } from 'service/relay/pool/seed';

export function RelayPoolManager() {
  const [relayPool, setRelayPool] = useState<RelayPool>();

  useEffect(() => {
    const relayPool = new RelayPool();
    relayPool.getAllRelays();
    setRelayPool(relayPool);
  }, []);

  const pickRelay = async () => {
      const relays = await RelayPool.pickRelay(seedRelays, [
        "63fe6318dc58583cfe16810f86dd09e18bfd76aabc24a0081ce2856f330504ed",
        "1bc70a0148b3f316da33fe3c89f23e3e71ac4ff998027ec712b905cd24f6a411",
        "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
        "634bd19e5c87db216555c814bf88e66ace175805291a6be90b15ac3b2247da9b"
      ]);
      console.log("pick relays!", relays);
  }

  return (
    <div>
      
      <Button onClick={pickRelay} >
        Pick relay
      </Button>
      
      <RelayPoolTable relays={relayPool?.relays || []}/>
    </div>
  );
}
