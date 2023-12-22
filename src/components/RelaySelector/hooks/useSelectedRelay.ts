import { useEffect, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { RelayMode } from '../type';

const SELECTED_RELAY_MODE_KEY = 'relay-selector:selected-mode:{{pubKey}}';
const SELECTED_RELAY_GROUP_ID_KEY =
  'relay-selector:selected-group-id:{{pubKey}}';

const getLegacyLocalValue = (key: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  const jsonVal = localStorage.getItem(key);
  if (jsonVal) {
    try {
      const value = JSON.parse(jsonVal);
      return value;
    } catch (e) {
      localStorage.setItem(key, JSON.stringify(jsonVal));
      return jsonVal;
    }
  }
};

export function useSelectedRelay(myPublicKey: string) {
  const selectedModeKey = SELECTED_RELAY_MODE_KEY.replace(
    '{{pubKey}}',
    myPublicKey,
  );
  const selectedGroupIdKey = SELECTED_RELAY_GROUP_ID_KEY.replace(
    '{{pubKey}}',
    myPublicKey,
  );

  const [selectedMode = getLegacyLocalValue(selectedModeKey), setSelectedMode] =
    useLocalStorage<RelayMode | undefined>(selectedModeKey, undefined);
  const [
    selectedGroupId = getLegacyLocalValue(selectedGroupIdKey),
    setSelectedGroupId,
  ] = useLocalStorage<string | undefined>(selectedGroupIdKey, undefined);

  const setSelectedRelay = ([mode, groupId]: [RelayMode, string]) => {
    setSelectedMode(mode);
    setSelectedGroupId(groupId);
  };

  return [[selectedMode, selectedGroupId], setSelectedRelay] as const;
}
