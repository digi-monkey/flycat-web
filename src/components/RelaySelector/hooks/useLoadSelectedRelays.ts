import { useEffect, useState } from 'react';
import { RelaySelectorStore } from '../store';
import { RelayMode } from '../type';
import { RelayGroupStorage } from 'service/relay/group/store';
import { Relay } from 'service/relay/type';

export function useLoadSelectedRelays(
  myPublicKey: string,
  modeCb: (relays: Relay[]) => any,
) {
  const store = new RelaySelectorStore();
  const groupStore = new RelayGroupStorage(myPublicKey);
	
  useEffect(() => {
    if (!myPublicKey) return;

    const selectedMode = store.loadSelectedMode(myPublicKey);
    const selectedGroup = store.loadSelectedGroupId(myPublicKey);

    if (selectedMode) {
      switch (selectedMode) {
        case RelayMode.global:
          {
            if (selectedGroup) {
              const groupMap = groupStore.load();
              if (groupMap) {
                const relays = groupMap.get(selectedGroup) || [];
                modeCb(relays);
              }
            }
          }

          break;

        case RelayMode.auto:
          {
            const relays = store.loadAutoRelayResult(myPublicKey) || [];
            modeCb(relays);
          }
          break;

        case RelayMode.fastest:
          {
            //todo
            const relays = store.loadAutoRelayResult(myPublicKey) || [];
            modeCb(relays);
          }
          break;

        default:
          break;
      }
    }
  }, [myPublicKey]);
}
