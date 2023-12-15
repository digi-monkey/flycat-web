import { ContactQuery, ProfileQuery, Query } from 'core/db/query';
import { Event } from 'core/nostr/Event';
import { RawEvent } from 'core/nostr/RawEvent';
import { CallWorker } from 'core/worker/caller';

export interface NostrWasmRuntimeProp {
  worker: CallWorker;
  signEvent?: (rawEvent: RawEvent) => Promise<Event>;
  loginUserPublicKey?: string;
  dbQuery?: Query;
  contactQuery?: ContactQuery;
  profileQuery?: ProfileQuery;
}

export interface Program {
  visitingProfile: (publicKey: string) => any;
}

export class NostrWasmRuntime {
  predefine: NostrWasmRuntimeProp;

  constructor(prop: NostrWasmRuntimeProp) {
    this.predefine = prop;
  }

  async loadProgram(code: ArrayBuffer, memory?: WebAssembly.Memory) {
    const conf: WebAssembly.Imports = {
      env: {
        predefine: () => this.predefine,
      },
    };
    if (memory) {
      conf.env.memory = memory;
    }
    const results = await WebAssembly.instantiate(code, conf);
    //const methods = results.instance.exports as unknown as Program;
    //return methods;
    return results;
  }
}
