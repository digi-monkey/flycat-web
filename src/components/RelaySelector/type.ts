export enum RelayMode {
  group = 'global', // todo: rename this value to group, some clients store this as global so will be breaking changed
  rule = 'rule',
}

export enum RelayFooterMenus {
  manageRelays = 'ManageRelays',
}

export function footerMenuToLabel(menu: RelayFooterMenus) {
  switch (menu) {
    case RelayFooterMenus.manageRelays:
      return 'Manage Relays..';
    default:
      throw new Error('unknown footer menu: ' + menu);
  }
}

export function labelToFooterMenu(val: string) {
  switch (val) {
    case 'Manage Relays..':
      return RelayFooterMenus.manageRelays;
    default:
      throw new Error('unknown footer menu: ' + val);
  }
}

export function isInFooterMenus(value: string): value is RelayFooterMenus {
  try {
    const menu = labelToFooterMenu(value);
    return Object.values(RelayFooterMenus).includes(menu as RelayFooterMenus);
  } catch (error) {
    return false;
  }
}

export function toLabel(mode: RelayMode) {
  switch (mode) {
    case RelayMode.group:
      return 'Relay Groups';

    case RelayMode.rule:
      return 'Relay Scripts(coming)';

    default:
      throw new Error('unknown mode: ' + mode);
  }
}

export function toRelayMode(value: string) {
  switch (value) {
    case RelayMode.group.toString():
      return RelayMode.group;

    case RelayMode.rule.toString():
      return RelayMode.rule;

    default:
      throw new Error('unknown mode: ' + value);
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
