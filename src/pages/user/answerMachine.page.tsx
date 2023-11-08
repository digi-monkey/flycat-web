import { dbQuery, profileQuery } from 'core/db';
import { Nip188 } from 'core/nip/188';
import { deserializeMetadata } from 'core/nostr/content';
import { EventSetMetadataContent } from 'core/nostr/type';
import { getMemoryPointer, readStringFromMemory } from 'core/wasm/helper';
import { NostrWasmRuntime } from 'core/wasm/runtime';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { useEffect, useState } from 'react';
import { isValidPublicKey } from 'utils/validator';
import styles from "./answerMachine.module.scss";

const AnswerMachine: React.FC<{ pubkey: string }> = ({ pubkey }) => {
  const myPublicKey = useReadonlyMyPublicKey();
  const { worker } = useCallWorker();
  const [userProfile, setUserProfile] = useState<EventSetMetadataContent>();
  const [message, setMessage] = useState<string>();

  const queryCode = async () => {
    if (!worker) return;
    const identifire = "wasm:profile:get_string";
    const filter = Nip188.createQueryNoscriptFilterById([pubkey], identifire);
    worker.subFilter({ filter });

    const relayUrl = worker.relays.map(r => r.url);
    const events = await dbQuery.matchFilterRelay(
      filter,
      relayUrl,
    );
    if (events.length > 0) {
      return Nip188.parseNoscript(events[0]);
    }
    return null;
  }

  useEffect(() => {
    if (!worker) return;

    const runtime = new NostrWasmRuntime({ worker });
    const memory = new WebAssembly.Memory({ initial: 256, maximum: 256 });

    queryCode()
      .then(async (bytes) => {
        if (bytes) {
          const res = await runtime.loadProgram(bytes, memory);
          const wasmInstance = res.instance;
          const { memory: wasmMemory, get_string } = wasmInstance.exports as any;

          // Allocate memory for input strings and the result string
          const encoder = new TextEncoder();
          const publicKey = encoder.encode(myPublicKey + '\0');
          const username = encoder.encode(userProfile?.name + '\0');

          const publicKeyPtr = getMemoryPointer(wasmMemory, publicKey);
          const usernamePtr = getMemoryPointer(wasmMemory, username);
          // Call the Rust function and get the result pointer
          const resultPtr = get_string(publicKeyPtr, usernamePtr);

          // Read the result string from memory
          const resultString = readStringFromMemory(wasmMemory, resultPtr);

          // Log the result string
          console.log('Result:', resultString);
          setMessage(resultString);
        }
      })
  }, [worker, userProfile]);

  useEffect(() => {
    if (!isValidPublicKey(myPublicKey)) return;

    profileQuery.getProfileByPubkey(myPublicKey).then(e => {
      if (e != null) {
        setUserProfile(deserializeMetadata(e.content));
      }
    });
  }, [myPublicKey]);

  return isValidPublicKey(myPublicKey) ? (
    <div className={styles.container}>
      < pre > {message}</ pre>
    </div >
  ) : (
    <div></div>
  );
};

export default AnswerMachine;
