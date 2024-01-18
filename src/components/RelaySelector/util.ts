import { RelayFooterMenus, RelayMode } from './type';
import { WsConnectStatus } from 'core/worker/type';
import { ICascaderOption } from 'components/shared/Cascader/type';
import { RelayGroup } from 'core/relay/group/type';

export function getRelayGroupOptions(groups: Record<string, RelayGroup>) {
  return Object.keys(groups).map(id => {
    const { title, relays } = groups[id]!;
    return {
      value: id,
      label: `${title}(${relays?.length ?? 0})`,
      group: RelayMode.Group,
    };
  });
}

export function initModeOptions(groups: Record<string, RelayGroup>) {
  const options: ICascaderOption[][] = [
    getRelayGroupOptions(groups),
    [
      {
        value: 'Relay Script',
        label: 'Relay Script (coming)',
        disabled: true,
      },
      ...getFooterMenus(),
    ],
  ];
  return options;
}

export function getFooterMenus() {
  return [
    {
      value: RelayFooterMenus.ManageRelays,
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
    ([_, isConnected]) => !!isConnected,
  ).length;
  return `${label} (${connected}/${all})`;
}

export function getConnectedRelayUrls(wsConnectStatus: WsConnectStatus) {
  const urls = Array.from(wsConnectStatus)
    .filter(([_, isConnected]) => !!isConnected)
    .map(([url]) => url);
  return urls;
}
