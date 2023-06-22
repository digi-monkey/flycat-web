import React, { useEffect, useState } from 'react';
import { RelayPool } from 'core/relay/pool';
import RelayPoolTable from './table';
import { Button } from 'antd';
import { Relay } from 'core/relay/type';
import { OneTimeWebSocketClient } from 'core/websocket/onetime';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
//import { seedRelays } from 'service/relay/pool/seed';

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

  const pickRelay = async () => {
    
    const seedRelays = [
      'wss://relay.nostr.band/',
      'wss://relay.nostr.bg/',
      'wss://universe.nostrich.land/',
      'wss://relay.snort.social/',
    ];
    
    console.log(myPublicKey, seedRelays);
    const contactList = await OneTimeWebSocketClient.fetchContactList({pubkey: myPublicKey, relays: seedRelays});
    console.log(contactList)
    if(contactList == null || contactList.length === 0)return alert("no contactlist");

    

      const relays = await RelayPool.pickRelay(seedRelays, contactList);
      console.log("pick relays!", relays);
  }

  return (
    <div>
      
      <Button onClick={pickRelay} >
        Pick relay
      </Button>
      
      <RelayPoolTable relays={relays}/>
    </div>
  );
}
