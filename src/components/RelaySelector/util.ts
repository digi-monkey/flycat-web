import { RelayGroups, RelayMode, RelayModeSelectOption, toLabel } from './type';

export function getSelectGroupId(groups: RelayGroups) {
  return Object.keys(groups)
    .filter(key => groups[key] != null)
    .map(key => `${key}`);
}

export function initRelayGroupOptions(groups: RelayGroups) {
  const ids = getSelectGroupId(groups);
  return ids.map(id => {
    return { value: id, label: `${id}(${groups[id]!.length})` };
  });
}

export function initModeOptions(groups: RelayGroups) {
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
