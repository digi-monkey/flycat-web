import { RelayGroupMap } from 'core/relay/group/type';
import {
  RelayMode,
  RelayFooterMenus,
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
    ...initRelayGroupOptions(groups),
    {
      value: RelayMode.rule,
      label: toLabel(RelayMode.rule),
      disabled: true,
      children: [{ value: '1', label: '1' }],
    },
  ];
  return mode;
}

export function getDisabledTitle() {
  return {
    value: 'title',
    label: 'Relay Groups',
    disabled: true,
  };
}

export function getFooterMenus() {
  return [
    {
      value: RelayFooterMenus.manageRelays,
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
  all: number,
) {
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
