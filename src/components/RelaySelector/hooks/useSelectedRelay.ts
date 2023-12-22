import { useCallback, useMemo } from 'react';
import { RelaySelectorStore } from '../store';
import { RelayMode } from '../type';

export function useSelectedRelay(myPublicKey: string) {
  const store = useMemo(() => new RelaySelectorStore(), []);
  console.log('useSelectedRelay', myPublicKey);
  const selectedRelay: [RelayMode, string] | [] = useMemo(() => {
    if (!myPublicKey) {
      return [];
    }
    const selectedMode = store.loadSelectedMode(myPublicKey);
    const selectedGroup = store.loadSelectedGroupId(myPublicKey);

    if (selectedMode) {
      const value =
        selectedMode === RelayMode.group && selectedGroup
          ? [selectedMode, selectedGroup]
          : [selectedMode];

      return value as [RelayMode, string];
    }
    return [];
  }, [myPublicKey, store]);

  const setSelectedRelay = useCallback(
    (value: [RelayMode, string]) => {
      console.log('setSelectedRelay', value, myPublicKey);
      if (!myPublicKey) {
        return;
      }

      const [mode, group] = value;
      if (mode && mode !== selectedRelay[0]) {
        store.saveSelectedMode(myPublicKey, mode);
      }
      if (group && group !== selectedRelay[1]) {
        store.saveSelectedGroupId(myPublicKey, group);
      }
    },
    [myPublicKey, store, selectedRelay],
  );

  return [selectedRelay, setSelectedRelay] as const;
}
