import { useEffect, useMemo } from 'react';
import { RelaySelectorStore } from '../store';
import { RelayMode } from '../type';

export function useLoadSelectedStore(
  myPublicKey: string,
  callback: (val: string[]) => any,
) {
  const store = useMemo(() => new RelaySelectorStore(), []);
  useEffect(() => {
    if (!myPublicKey) return;

    const selectedMode = store.loadSelectedMode(myPublicKey);
    const selectedGroup = store.loadSelectedGroupId(myPublicKey);

    if (selectedMode) {
      const value =
        selectedMode === RelayMode.group && selectedGroup
          ? [selectedMode, selectedGroup]
          : [selectedMode];

      callback(value);
    }
  }, [myPublicKey, callback, store]);
}
