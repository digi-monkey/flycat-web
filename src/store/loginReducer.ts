import { RawEvent, Event } from 'service/api';
import { Nip06 } from 'service/nip/06';

declare global {
  interface Window {
    nostr?: Nip06;
    webln?: {
      enable: () => any;
    };
  }
}

export enum LoginMode {
  local = 'local', // default
  nip07 = 'nip07', // https://github.com/nostr-protocol/nips/blob/master/07.md
  metamask = 'metamask',
  nexus = 'nexus',
}

export enum LoginActionType {
  login = 'LOGIN',
  logout = 'LOGOUT',
  loginPending = 'LOGIN_PENDING',
  loginSuccess = 'LOGIN_SUCCESS',
  loginFailure = 'LOGIN_FAILURE',
}

export interface LoginRequest {
  mode: LoginMode;
  publicKey?: string;
  privateKey?: string;
}

export interface LoginAction {
  type: LoginActionType;
  payload?: {
    error?: Error;
    signer?: Signer;
  };
}

export type SignEvent = (rawEvent: RawEvent) => Promise<Event>;
export type GetPublicKey = () => Promise<string>;
export interface Signer {
  mode: LoginMode;
  isLoggedIn: boolean;
  getPublicKey: GetPublicKey;
  signEvent?: SignEvent;
  publicKey?: string; // for saving in localStorage under local mode
  privateKey?: string; // for saving in localStorage under local mode
}

function loginPending() {
  return { type: LoginActionType.loginPending };
}

function loginSuccess(signer) {
  return { type: LoginActionType.loginSuccess, payload: { signer } };
}

function loginFailure(error) {
  return { type: LoginActionType.loginFailure, payload: { error } };
}

// Async action creator (thunk)
export function login(request: LoginRequest) {
  return async dispatch => {
    dispatch(loginPending());

    try {
      const signer = await getLoginInfo(request);
      dispatch(loginSuccess(signer));
    } catch (error) {
      dispatch(loginFailure(error));
    }
  };
}

const defaultSigner = {
  mode: LoginMode.local,
  isLoggedIn: false,
  getPublicKey: async () => {
    return '';
  },
  publicKey: '',
  privateKey: '',
};

export const loginReducer = (
  state: Signer = defaultSigner,
  action: LoginAction,
): Signer => {
  switch (action.type) {
    case LoginActionType.loginPending:
      return defaultSigner;

    case LoginActionType.loginSuccess:
      return action.payload!.signer!;

    case LoginActionType.loginFailure:
      return defaultSigner;

    case LoginActionType.login:
      return defaultSigner;

    case LoginActionType.logout:
      clearTempMyPublicKey();
      return defaultSigner;

    default:
      return state;
  }
};

export async function getLoginInfo(action: LoginRequest): Promise<Signer> {
  const mode = action.mode;
  switch (mode) {
    case LoginMode.local:
      if (!action.publicKey || action.publicKey.length === 0) {
        throw new Error(
          'action.publicKey can not be null under local login mode',
        );
      }
      saveTempMyPublicKey(action.publicKey);

      return {
        mode,
        isLoggedIn: true,
        getPublicKey: async () => {
          return action.publicKey!;
        },
        signEvent:
          action.privateKey && action.privateKey?.length > 0
            ? async (raw: RawEvent) => {
                return await raw.toEvent(action.privateKey!);
              }
            : undefined,

        publicKey: action.publicKey,
        privateKey: action.privateKey,
      };

    case LoginMode.nip07:
      if (!window.nostr) {
        throw new Error('window.nostr not found!');
      }
      const pk = await window.nostr!.getPublicKey();
      const isLoggedIn = pk != null && pk.length > 0;
      saveTempMyPublicKey(pk);

      return {
        mode,
        isLoggedIn: isLoggedIn,
        getPublicKey: async () => {
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

const tempMyPkItemKey = 'temp.myPublicKey';

export function saveTempMyPublicKey(pk: string | undefined) {
  if (pk == null || pk.length === 0) return;
  localStorage.setItem(tempMyPkItemKey, pk);
}

export function loadTempMyPublicKey() {
  return localStorage.getItem(tempMyPkItemKey);
}

export function clearTempMyPublicKey() {
  if (loadTempMyPublicKey() != null) localStorage.removeItem(tempMyPkItemKey);
}
