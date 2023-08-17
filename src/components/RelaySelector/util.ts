import { RelayGroupMap } from 'core/relay/group/type';
import {
  RelayMode,
  RelayModeSelectMenus,
  RelayModeSelectOption,
  toLabel,
} from './type';
import { WsConnectStatus } from 'core/worker/type';

export function getSelectGroupId(groups: RelayGroupMap) {
  return Array.from(groups.keys()).filter(key => groups.get(key) != null);
}

export function initRelayGroupOptions(groups: RelayGroupMap) {
  const ids = getSelectGroupId(groups);
  return ids.map(id => {
    return { value: id, label: `${id}(${groups.get(id)!.length})` };
  });
}

export function initModeOptions(groups: RelayGroupMap) {
  const mode: RelayModeSelectOption[] = [
    {
      value: RelayMode.group,
      label: toLabel(RelayMode.group),
      children: initRelayGroupOptions(groups),
    },
    { value: RelayMode.rule, label: toLabel(RelayMode.rule), disabled: true },
  ];
  return mode;
}

export function getDisabledTitle() {
  return {
    value: 'title',
    label: 'Select Relays',
    disabled: true,
  };
}

export function getFooterMenus() {
  return [
    {
      value: RelayModeSelectMenus.manageRelays,
      label: 'Manage Relays..',
    },
  ];
}

export function isFastestRelayOutdated(
  timestamp: number,
  threshold: number = 5 * 60 * 1000,
): boolean {
  const currentTime = Date.now();
  return currentTime - timestamp > threshold;
}

export function toConnectStatus(
  label: string,
  wsConnectStatus: WsConnectStatus,
) {
  const all = Array.from(wsConnectStatus).length;
  const connected = Array.from(wsConnectStatus).filter(
    w => w[1] === true,
  ).length;
  return label.split('(')[0] + ` (${connected}/${all})`;
}

export function getConnectedRelayUrl(wsConnectStatus: WsConnectStatus) {
  const connected = Array.from(wsConnectStatus)
    .filter(w => w[1] === true)
    .map(w => w[0]);
  return connected;
}
