import React, { useEffect, useState } from 'react';
import { RelayPool } from 'core/relay/pool';
import RelayPoolTable from './table';
import { Relay } from 'core/relay/type';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';

export function RelayPoolManager() {
  const myPublicKey = useReadonlyMyPublicKey();
  const [relays, setRelays] = useState<Relay[]>([]);

  useEffect(() => {
    initRelays(); 
  }, []);

  const initRelays = async () => {
    const relayPool = new RelayPool();
    const relays = await relayPool.getAllRelays(true);
    setRelays(relays);
  }

  return (
    <RelayPoolTable relays={relays}/>
  );
}
