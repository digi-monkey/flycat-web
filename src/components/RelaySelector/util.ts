import { RelayGroupMap } from 'core/relay/group/type';
import { RelayMode, RelayModeSelectMenus, RelayModeSelectOption, toLabel } from './type';

export function getSelectGroupId(groups: RelayGroupMap) {
  return Array.from(groups.keys())
    .filter(key => groups.get(key) != null);
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
      value: RelayMode.global,
      label: toLabel(RelayMode.global),
      children: initRelayGroupOptions(groups),
    },
    { value: RelayMode.auto, label: toLabel(RelayMode.auto) },
    { value: RelayMode.fastest, label: toLabel(RelayMode.fastest) },
    { value: RelayMode.rule, label: toLabel(RelayMode.rule), disabled: true },
  ];
  return mode;
}

export function getDisabledTitle() {
  return {
    value: 'Relay Mode',
    label: 'Relay Mode',
    disabled: true,
  }
}

export function getFooterMenus() {
  return [{
    value: RelayModeSelectMenus.displayBenchmark,
    label: 'Display benchmark',
  }, {
    value: RelayModeSelectMenus.aboutRelayMode,
    label: 'About Relay Mode',
  }, {
    value: RelayModeSelectMenus.manageRelays,
    label: 'Manage Relays..'
  }]
}
