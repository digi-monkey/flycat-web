import { useEffect } from 'react';
import { db } from 'service/relay/auto';
import { RelayMode, toRelayMode } from '../type';
import { RelaySelectorStore } from '../store';
import { RelayPool } from 'service/relay/pool';
import { SwitchRelays } from 'service/worker/type';
import { RelayGroupMap } from 'service/relay/group/type';
import { OneTimeWebSocketClient } from 'service/websocket/onetime';

export function useGetSwitchRelay(
  myPublicKey: string,
  groups: RelayGroupMap,
  selectedValue: string[] | undefined,
  cb: (val: SwitchRelays) => any,
	progressBeginCb?: ()=>any,
	progressEndCb?: ()=>any,
  progressCb?: (restCount: number) => any
) {
  const store = new RelaySelectorStore();

  async function getSwitchRelay(val: string[]): Promise<SwitchRelays> {
    const mode: RelayMode = toRelayMode(val[0]);
    const groupId = val[1];

    if (mode === RelayMode.auto) {
      const savedResult = store.loadAutoRelayResult(myPublicKey);
      if (savedResult) {
        return {
          id: mode,
          relays: savedResult,
        };
      }

      const relayPool = new RelayPool();

      let contactList = await OneTimeWebSocketClient.fetchContactList({pubkey: myPublicKey, relays: relayPool.seedRelays});
      if(contactList == null){
        contactList = [myPublicKey];
      }
      const allRelays = (await relayPool.getAllRelays()).map(r => r.url);
      await RelayPool.getBestRelay(allRelays, myPublicKey, progressCb);
      const bestRelay = (await db.pick(myPublicKey)).slice(0, 6).map(i => i.relay);

      const pickRelays = await RelayPool.pickRelay(
        relayPool.seedRelays,
        contactList,
      );

      const relays = [...bestRelay, ...pickRelays];
      console.log("bestRelay: ", bestRelay, "pick nip-65 relays: ", pickRelays);
      
     // const relays = (await db.a(myPublicKey)).slice(0, 6).map(i => i.relay);
      store.saveAutoRelayResult(
        myPublicKey,
        relays.map(r => {
          return { url: r, read: false, write: true };
        }),
      );

      return {
        id: mode,
        relays: relays.map(r => {
          return {
            url: r,
            read: false,
            write: true,
          };
        }),
      };
    }

    if (mode === RelayMode.fastest) {
      const relayPool = new RelayPool();
      const allRelays = await relayPool.getAllRelays();
      const fastest = await RelayPool.getFastest(allRelays.map(r => r.url));

      return {
        id: mode,
        relays: [
          {
            url: fastest[0],
            read: true,
            write: true,
          },
        ],
      };
    }

    if (mode === RelayMode.rule) {
      return {
        id: mode,
        relays: [], // todo
      };
    }

    if (mode === RelayMode.global) {
      if (!groupId) throw new Error('no selected group id');

      return {
        id: groupId,
        relays: groups.get(groupId)!,
      };
    }

    throw new Error('unknown mode');
  }

  async function onSelectedValueChange() {
    if (selectedValue) {
      const mode = toRelayMode(selectedValue[0]);
      const selectedGroup = selectedValue[1];

      const savedSelectedMode = store.loadSelectedMode(myPublicKey);
      if (savedSelectedMode !== mode) {
        store.saveSelectedMode(myPublicKey, mode);
      }

      const savedSelectedGroupId = store.loadSelectedGroupId(myPublicKey);
      if (selectedGroup && savedSelectedGroupId !== selectedGroup) {
        store.saveSelectedGroupId(myPublicKey, selectedGroup);
      }

			if(progressBeginCb){
				progressBeginCb();
			}
			// a very time-consuming operation
      const switchRelays = await getSwitchRelay(selectedValue);

		  if(progressEndCb){
				progressEndCb();
			}	

			// return the result
      cb(switchRelays);
    }
  }

  useEffect(() => {
    onSelectedValueChange();
  }, [selectedValue]);
}
