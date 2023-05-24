import { useEffect } from 'react';
import { RelaySelectorStore } from '../store';
import { RelayMode } from '../type';

export function useLoadSelectedStore(
  myPublicKey: string,
  modeCb: (val: string[]) => any,
) {
  const store = new RelaySelectorStore();
  useEffect(() => {
    if (!myPublicKey) return;

    const selectedMode = store.loadSelectedMode(myPublicKey);
    const selectedGroup = store.loadSelectedGroupId(myPublicKey);
    
    if (selectedMode) {
      const value =
        selectedMode === RelayMode.global && selectedGroup
          ? [selectedMode, selectedGroup]
          : [selectedMode];
          
			modeCb(value);
    }
  }, [myPublicKey]);
}
