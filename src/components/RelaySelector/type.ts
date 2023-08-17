export enum RelayMode {
  group = 'global', // todo: rename this value to group
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
      return 'Relay Scripts';

    default:
      throw new Error('unknown mode');
  }
}

export function toRelayMode(value: string) {
  switch (value) {
    case 'global':
      return RelayMode.group;

    case 'rule':
      return RelayMode.rule;

    default:
      throw new Error('unknown mode');
  }
}

export interface RelayModeSelectOption {
  value: RelayMode;
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
