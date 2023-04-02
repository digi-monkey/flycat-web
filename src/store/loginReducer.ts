import { RawEvent, Event } from 'service/api';
import { getPublicKeyFromDotBit } from 'service/dotbit';
import {
  createMetamaskSignEvent,
  createMetamaskGetPublicKey,
  getPublicKeyFromMetamaskSignIn,
} from 'service/evm/metamask';
import {
  createWalletConnectSignEvent,
  createWalletConnectGetPublicKey,
  getPublicKeyFromWalletConnectSignIn,
} from 'service/evm/walletConnect';
import { disconnectWagmi } from 'service/evm/wagmi/helper';


export enum LoginMode {
  local = 'local', // default
  nip07Wallet = 'nip07', // https://github.com/nostr-protocol/nips/blob/master/07.md
  metamask = 'metamask',
  walletConnect = 'wallet-connect',
  nexus = 'nexus',
  dotbit = 'dotbit',
  nip05Domain = 'nip05',
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
  didAlias?: string;
  nip05DomainName?: string;
  evmUsername?: string;
  evmPassword?: string;
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

  didAlias?: string; // only for dotbit mode
  nip05DomainName?: string; // only for nip05 mode

  evmUsername?: string; // only for evm chain sign-in mode like metamask
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
      if(state.mode === LoginMode.walletConnect){
        disconnectWagmi();
      }
      return defaultSigner;

    default:
      return state;
  }
};

export async function getLoginInfo(request: LoginRequest): Promise<Signer> {
  const mode = request.mode;
  switch (mode) {
    case LoginMode.local:
      if (!request.publicKey || request.publicKey.length === 0) {
        throw new Error(
          'action.publicKey can not be null under local login mode',
        );
      }
      saveTempMyPublicKey(request.publicKey);

      return {
        mode,
        isLoggedIn: true,
        getPublicKey: async () => {
          return request.publicKey!;
        },
        signEvent:
          request.privateKey && request.privateKey?.length > 0
            ? async (raw: RawEvent) => {
                return await raw.toEvent(request.privateKey!);
              }
            : undefined,

        publicKey: request.publicKey,
        privateKey: request.privateKey,
      };

    case LoginMode.nip07Wallet:
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

    case LoginMode.dotbit: {
      if (request.didAlias == null) {
        throw new Error('didAlias not found in dotbit mode');
      }
      const pk = await requestPublicKeyFromDotBit(request.didAlias);
      saveTempMyPublicKey(pk);

      const isLoggedIn = pk != null && pk.length > 0;

      return {
        mode,
        isLoggedIn: isLoggedIn,
        getPublicKey: async () => {
          return await requestPublicKeyFromDotBit(request.didAlias!);
        },
        signEvent: undefined,
        didAlias: request.didAlias,
      };
    }

    case LoginMode.nip05Domain: {
      if (request.nip05DomainName == null) {
        throw new Error('nip05DomainName not found in nip05 mode');
      }

      const pk = await requestPublicKeyFromNip05DomainName(
        request.nip05DomainName,
      );
      saveTempMyPublicKey(pk);

      return {
        mode,
        isLoggedIn: true,
        getPublicKey: async () => {
          return await requestPublicKeyFromNip05DomainName(
            request.nip05DomainName!,
          );
        },
        signEvent: undefined,
        nip05DomainName: request.nip05DomainName,
      };
    }

    case LoginMode.metamask: {
      if (!request.evmUsername) {
        throw new Error('eth username not found!');
      }
      const getPublicKey = createMetamaskGetPublicKey(request.evmUsername);
      const pk = await getPublicKeyFromMetamaskSignIn(
        request.evmUsername,
        request.evmPassword,
      );
      const isLoggedIn = pk != null && pk.length > 0;
      saveTempMyPublicKey(pk);

      return {
        mode,
        isLoggedIn: isLoggedIn,
        getPublicKey: getPublicKey,
        signEvent: createMetamaskSignEvent(request.evmUsername),
        evmUsername: request.evmUsername,
      };
    }

    case LoginMode.walletConnect: {
      if (!request.evmUsername) {
        throw new Error('eth username not found!');
      }
      const getPublicKey = createWalletConnectGetPublicKey(request.evmUsername);
      const pk = await getPublicKeyFromWalletConnectSignIn(
        request.evmUsername,
        request.evmPassword,
      );
      const isLoggedIn = pk != null && pk.length > 0;
      saveTempMyPublicKey(pk);

      return {
        mode,
        isLoggedIn: isLoggedIn,
        getPublicKey: getPublicKey,
        signEvent: createWalletConnectSignEvent(request.evmUsername),
        evmUsername: request.evmUsername,
      };
    }

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

export async function requestPublicKeyFromDotBit(
  didAlias: string,
): Promise<string> {
  if (!didAlias.endsWith('.bit')) {
    throw new Error('dotbit alias must ends with .bit');
  }

  const pk = await getPublicKeyFromDotBit(didAlias);
  if (pk == null) {
    throw new Error('nostr key value not found in' + didAlias);
  }
  return pk;
}

export async function requestPublicKeyFromNip05DomainName(
  domainName: string,
): Promise<string> {
  if (!domainName.includes('@')) {
    throw new Error('invalid domain name! not including @');
  }

  const username = domainName.split('@')[0];
  const website = domainName.split('@')[1];

  const response = await fetch(
    `https://${website}/.well-known/nostr.json?name=${username}`,
  );
  const data = await response.json();
  if (data == null || data.names == null) {
    throw new Error('invalid domain for nip05 ' + domainName);
  }
  const pk = data.names[username];
  if (pk == null) {
    throw new Error('invalid username for nip05 ' + domainName);
  }

  return pk;
}
