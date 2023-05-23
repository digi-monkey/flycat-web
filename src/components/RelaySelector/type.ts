import { Relay } from 'service/relay/type';

export interface RelayGroup {
	id: string,
   relays: RelayGroups,
}
export interface RelayGroups {
  [name: string]: Relay[] | undefined;
}

export enum RelayMode {
  global = 'global',
  auto = 'auto',
  fastest = 'fastest',
  rule = 'rule',
}

export function toLabel(mode: RelayMode) {
  switch (mode) {
    case RelayMode.global:
      return 'Global';

    case RelayMode.auto:
      return 'Auto';

    case RelayMode.fastest:
      return 'Fastest';

    case RelayMode.rule:
      return 'Rule';

    default:
      throw new Error('unknown mode');
  }
}

export function toRelayMode(value: string) {
  switch (value) {
    case 'global':
      return RelayMode.global;

    case 'auto':
      return RelayMode.auto;

    case 'fastest':
      return RelayMode.fastest;

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
