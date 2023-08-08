import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { RelayPool } from 'core/relay/pool';
import { RelayGroup as RelayGroupClass } from 'core/relay/group';
import RelayPoolTable from './table';
import { Relay } from 'core/relay/type';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';


interface RelayPoolManagerProp {
  groups: RelayGroupClass | undefined;
  setGroups: Dispatch<SetStateAction<RelayGroupClass | undefined>>;
}

export function RelayPoolManager({groups, setGroups}) {
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
    <RelayPoolTable groups={groups} setGroups={setGroups} relays={relays}/>
  );
}
