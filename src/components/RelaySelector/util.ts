import { RelayGroupMap } from 'core/relay/group/type';
import { RelayFooterMenus } from './type';
import { WsConnectStatus } from 'core/worker/type';
import { ICascaderOption } from 'components/shared/Cascader/types';

export function getSelectGroupId(groups: RelayGroupMap) {
  return Array.from(groups.keys()).filter(key => groups.get(key) != null);
}

export function initRelayGroupOptions(groups: RelayGroupMap) {
  const ids = getSelectGroupId(groups);
  return ids.map(id => {
    return {
      value: id,
      label: `${id}(${groups.get(id)!.length})`,
      group: 'Relay Groups',
    };
  });
}

export function initModeOptions(groups: RelayGroupMap) {
  const options: ICascaderOption[] = [
    ...initRelayGroupOptions(groups),
    {
      value: 'Script',
      label: 'Script',
      disabled: true,
      group: 'Rule',
    },
  ];
  return options;
}

// FIXME: show manage relays menu only when there are more than one relay groups
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
  label: string[],
  wsConnectStatus: WsConnectStatus,
  all: number,
) {
  const connected = Array.from(wsConnectStatus).filter(
    ([_, isConnected]) => !!isConnected,
  ).length;
  return label.join('/') + ` (${connected}/${all})`;
}

export function getConnectedRelayUrls(wsConnectStatus: WsConnectStatus) {
  const urls = Array.from(wsConnectStatus)
    .filter(([_, isConnected]) => !!isConnected)
    .map(([url]) => url);
  return urls;
}
