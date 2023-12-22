export enum RelayMode {
  Group = 'global', // todo: rename this value to group, some clients store this as global so will be breaking changed
  Rule = 'rule',
}

export enum RelayFooterMenus {
  ManageRelays = 'ManageRelays',
}

export function footerMenuToLabel(menu: RelayFooterMenus) {
  switch (menu) {
    case RelayFooterMenus.ManageRelays:
      return 'Manage Relays..';
    default:
      throw new Error('unknown footer menu: ' + menu);
  }
}

export function labelToFooterMenu(val: string) {
  switch (val) {
    case 'Manage Relays...':
      return RelayFooterMenus.ManageRelays;
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
    case RelayMode.Group:
      return 'Relay Groups';
    case RelayMode.Rule:
      return 'Relay Scripts';
    default:
      throw new Error('unknown mode: ' + mode);
  }
}

export function toRelayMode(value: string) {
  switch (value) {
    case RelayMode.Group.toString():
      return RelayMode.Group;
    case RelayMode.Rule.toString():
      return RelayMode.Rule;
    default:
      return RelayMode.Group;
  }
}
