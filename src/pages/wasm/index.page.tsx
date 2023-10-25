import { useEffect, useState } from 'react';
import init, { greet, fibonacci, is_valid_event } from 'wasm';
import { NostrWasmRuntime } from 'core/wasm/runtime';
import { useCallWorker } from 'hooks/useWorker';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
//import anotherInit, { is_valid_event } from '../../../wasm/pkg/wasm';
import { Event } from 'core/nostr/Event';

const Example: React.FC = () => {
  const [message, setMessage] = useState('');
  const { worker } = useCallWorker();
  const myPublicKey = useReadonlyMyPublicKey();

  async function initWasm() {
    try {
      await init();
      setMessage(greet('Next.js and WebAssembly'));
      const event: Event = {
        id: "aaa",
        pubkey: "bbb",
        sig: "ccc",
        content: "",
        kind: 1,
        created_at: 1000,
        tags: []
      }
      //await anotherInit();
      //await init();
      console.log("is_valid_event(event): ", is_valid_event(event), fibonacci);
    } catch (error) {
      console.error('Error initializing WebAssembly module:', error);
    }
  }

  useEffect(() => {
    //setMessage(greet('Next.js and WebAssembly'));
    initWasm();
  }, []);

  return <div>{message}</div>;
};

export default Example;
