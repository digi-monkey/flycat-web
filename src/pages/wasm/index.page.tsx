import { useEffect, useState } from 'react';
import init, { greet } from 'wasm';
import { NostrWasmRuntime } from 'core/wasm/runtime';
import { useCallWorker } from 'hooks/useWorker';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';

const Example: React.FC = () => {
  const [message, setMessage] = useState('');
  const { worker } = useCallWorker();
  const myPublicKey = useReadonlyMyPublicKey();

  async function initWasm() {
    try {
      await init();
      setMessage(greet('Next.js and WebAssembly'));
    } catch (error) {
      console.error('Error initializing WebAssembly module:', error);
    }
  }

  useEffect(() => {
    //setMessage(greet('Next.js and WebAssembly'));
    //initWasm();

    if (!worker) return;

    const runtime = new NostrWasmRuntime({
      worker,
      loginUserPublicKey: myPublicKey,
    });

    function getMemoryPointer(wasmMemory, data) {
      console.log('length:', data.length, wasmMemory);
      const ptr = wasmMemory.grow(data.length);
      new Uint8Array(wasmMemory.buffer, ptr, data.length).set(data);
      return ptr;
    }

    function readStringFromMemory(wasmMemory, ptr) {
      const data = new Uint8Array(wasmMemory.buffer);
      const stringArray: any[] = [];

      // Read characters from memory until null terminator is encountered
      for (let i = ptr; data[i] !== 0; ++i) {
        stringArray.push(data[i]);
      }

      // Create a string from the character codes and return
      return new TextDecoder().decode(new Uint8Array(stringArray));
    }

    const memory = new WebAssembly.Memory({ initial: 256, maximum: 256 });

    fetch('profile.wasm')
      .then(res => res.arrayBuffer())
      .then(bytes => runtime.loadProgram(bytes, memory))
      .then(res => {
        const wasmInstance = res.instance;

        const { memory: wasmMemory, get_string } = wasmInstance.exports as any;

        // Allocate memory for input strings and the result string
        const encoder = new TextEncoder();
        const publicKey = encoder.encode(myPublicKey + '\0');
        const username = encoder.encode('ElectronicMonkey\0');

        const publicKeyPtr = getMemoryPointer(wasmMemory, publicKey);
        const usernamePtr = getMemoryPointer(wasmMemory, username);
        // Call the Rust function and get the result pointer
        const resultPtr = get_string(publicKeyPtr, usernamePtr);

        // Read the result string from memory
        const resultString = readStringFromMemory(wasmMemory, resultPtr);

        // Log the result string
        console.log('Result:', resultString);

        setMessage(resultString);
      });
  }, [worker]);

  return <div>{message}</div>;
};

export default Example;
