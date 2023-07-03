import { useEffect } from 'react';
import { db } from 'core/relay/auto';
import { RelayMode, toRelayMode } from '../type';
import { RelaySelectorStore } from '../store';
import { RelayPool } from 'core/relay/pool';
import { SwitchRelays } from 'core/worker/type';
import { RelayGroupMap } from 'core/relay/group/type';
import { OneTimeWebSocketClient } from 'core/api/onetime';
import { isFastestRelayOutdated } from '../util';

export function useGetSwitchRelay(
  myPublicKey: string,
  groups: RelayGroupMap,
  selectedValue: string[] | undefined,
  cb: (val: SwitchRelays) => any,
  progressCb?: (restCount: number) => any,
  progressEnd?: ()=>any
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
      const seeds =  relayPool.seeds;
      const contactList = await OneTimeWebSocketClient.fetchContactList({pubkey: myPublicKey, relays: ['wss://relay.nostr.band']}) || [];
      if(!contactList.includes(myPublicKey)){
        contactList.push(myPublicKey);
      }
      const relays = await relayPool.getAutoRelay(seeds, contactList, myPublicKey, progressCb);
      if(progressEnd){
        progressEnd();
      }

      store.saveAutoRelayResult(
        myPublicKey,
        relays.map(r => {
          return { url: r, read: true, write: true };
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
      const savedResult = store.loadFastestRelayResult(myPublicKey);
      if (savedResult && !isFastestRelayOutdated(savedResult.updated_at)) {
        return {
          id: mode,
          relays: savedResult.relays,
        };
      }

      const relayPool = new RelayPool();
      const allRelays = await relayPool.getAllRelays();
      const fastest = await RelayPool.getFastest(allRelays.map(r => r.url), progressCb);
      if(progressEnd){
        progressEnd();
      }

      const relays = [{ url: fastest[0], read: true, write: true }];
      store.saveFastestRelayResult(
        myPublicKey,
        relays
      );

      return {
        id: mode,
        relays,
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

			// a very time-consuming operation
      const switchRelays = await getSwitchRelay(selectedValue);

			// return the result
      cb(switchRelays);
    }
  }

  useEffect(() => {
    onSelectedValueChange();
  }, [selectedValue]);
}
