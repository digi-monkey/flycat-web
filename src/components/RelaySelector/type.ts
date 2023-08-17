export enum RelayMode {
  group = 'global', // todo: rename this value to group, some clients store this as global so will be breaking changed
  rule = 'rule',
}

export enum RelayModeSelectMenus {
  manageRelays = 'ManageRelays',
}

export function toLabel(mode: RelayMode) {
  switch (mode) {
    case RelayMode.group:
      return 'Relay Groups';

    case RelayMode.rule:
      return 'Relay Scripts(coming)';

    default:
      throw new Error('unknown mode');
  }
}

export function toRelayMode(value: string) {
  switch (value) {
    case RelayMode.group.toString():
      return RelayMode.group;

    case RelayMode.rule.toString():
      return RelayMode.rule;

    default:
      throw new Error('unknown mode ' + value);
  }
}

export interface RelayModeSelectOption {
  value: RelayMode | string;
  label: string;
  children?: (RelayGroupSelectOption | RelayScriptSelectOption)[];
  disabled?: boolean;
}

export interface RelayGroupSelectOption {
  value: string;
  label: string;
}

export interface RelayScriptSelectOption {
  value: string;
  label: string;
}
