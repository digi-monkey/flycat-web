import { RawEvent, Event } from 'service/api';
import { Nip06 } from 'service/nip/06';

declare global {
  interface Window {
    nostr?: Nip06;
  }
}

export enum LoginMode {
  local, // default
  nip07, // https://github.com/nostr-protocol/nips/blob/master/07.md
  metamask,
  nexus,
}

export enum LoginActionType {
  login = 'LOGIN',
  logout = 'LOGOUT',
}
export interface LoginAction {
  type: LoginActionType;
  mode: LoginMode;
  publicKey?: string;
  privateKey?: string;
}

export interface Signer {
  mode: LoginMode;
  isLoggedIn: boolean;
  publicKey: () => Promise<string>;
  signEvent?: (rawEvent: RawEvent) => Promise<Event>;
}

export const loginReducer = (
  state = {
    isLoggedIn: false,
    publicKey: '',
    privateKey: '',
  },
  action: LoginAction = {
    mode: LoginMode.local,
    type: LoginActionType.login,
    publicKey: '',
  },
) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        isLoggedIn: true,
        mode: action.mode,
        publicKey: action.publicKey,
        privateKey: action.privateKey,
      };
    case 'LOGOUT':
      return {
        isLoggedIn: false,
        mode: action.mode,
        publicKey: '',
        privateKey: '',
      };
    default:
      return state;
  }
};

export async function getLoginInfo(action: LoginAction): Promise<Signer> {
  const mode = action.mode;
  switch (mode) {
    case LoginMode.local:
      if (!action.publicKey || action.publicKey.length === 0) {
        throw new Error(
          'action.publicKey can not be null under local login mode',
        );
      }
      return {
        mode,
        isLoggedIn: true,
        publicKey: async () => {
          return action.publicKey!;
        },
        signEvent:
          action.privateKey && action.privateKey?.length > 0
            ? async (raw: RawEvent) => {
                return await raw.toEvent(action.privateKey!);
              }
            : undefined,
      };

    case LoginMode.nip07:
      if (!window.nostr) {
        throw new Error('window.nostr not found!');
      }
      return {
        mode,
        isLoggedIn: true,
        publicKey: async () => {
          return await window.nostr!.getPublicKey();
        },
        signEvent: async (raw: RawEvent) => {
          return await window.nostr!.signEvent(raw);
        },
      };

    case LoginMode.metamask:
      throw new Error('not impl');

    case LoginMode.nexus:
      throw new Error('not impl');

    default:
      throw new Error('invalid action mode ' + mode);
  }
}
