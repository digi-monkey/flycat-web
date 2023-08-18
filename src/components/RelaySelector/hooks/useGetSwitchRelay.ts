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

    if (mode === RelayMode.rule) {
      return {
        id: mode,
        relays: [], // todo
      };
    }

    if (mode === RelayMode.group) {
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
