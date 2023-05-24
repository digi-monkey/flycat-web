import { useEffect } from 'react';
import { db } from 'service/relay/auto';
import { RelayGroups, RelayMode, toRelayMode } from '../type';
import { RelaySelectorStore } from '../store';
import { Pool } from 'service/relay/pool';
import { SwitchRelays } from 'service/worker/type';

export function useGetSwitchRelay(
  myPublicKey: string,
  groups: RelayGroups,
  selectedValue: string[] | undefined,
  cb: (val: SwitchRelays) => any,
	progressBeginCb?: ()=>any,
	progressEndCb?: ()=>any,
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

      const relayPool = new Pool();
      const allRelays = await relayPool.getAllRelays();
      await Pool.getBestRelay(
        allRelays.map(r => r.url),
        myPublicKey,
      );
      const relays = (await db.pick(myPublicKey)).slice(0, 6).map(i => i.relay);
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
      const relayPool = new Pool();
      const allRelays = await relayPool.getAllRelays();
      const fastest = await Pool.getFastest(allRelays.map(r => r.url));

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
        relays: groups[groupId]!,
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
      if (savedSelectedGroupId !== selectedGroup) {
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
