import { useEffect, useState } from 'react';
import { RelaySelectorStore } from '../store';
import { RelayMode } from '../type';
import { RelayGroupStorage } from 'core/relay/group/store';
import { Relay } from 'core/relay/type';

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
        case RelayMode.group:
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

        default:
          break;
      }
    }
  }, [myPublicKey]);
}
