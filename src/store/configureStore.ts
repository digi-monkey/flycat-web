/**
 * Create the store with dynamic reducers
 */

import thunk from 'redux-thunk';
import createSagaMiddleware from 'redux-saga';

import { RawEvent } from 'service/api';
import { relayReducer } from './relayReducer';
import { createReducer } from './reducers';
import { createWrapper } from "next-redux-wrapper";
import { createInjectorsEnhancer } from 'redux-injectors';
import {
  configureStore,
  getDefaultMiddleware,
  StoreEnhancer,
} from '@reduxjs/toolkit';
import {
  LoginMode,
  loginReducer,
  requestPublicKeyFromDotBit,
  requestPublicKeyFromNip05DomainName,
} from './loginReducer';

// Define the shape of your store state
export interface RootState {
  loginReducer: ReturnType<typeof loginReducer>;
  relayReducer: ReturnType<typeof relayReducer>;
  // ... other reducers
}

export interface SavableRootState {
  loginReducer: Omit<
    ReturnType<typeof loginReducer>,
    'getPublicKey' | 'signEvent'
  >;
  relayReducer: ReturnType<typeof relayReducer>;
}

export function toSavableRootState(state: RootState): SavableRootState {
  const savableState: SavableRootState = {
    loginReducer: {
      mode: state.loginReducer.mode,
      isLoggedIn: state.loginReducer.isLoggedIn,
    },
    relayReducer: state.relayReducer,
  };
  if (state.loginReducer.privateKey) {
    savableState.loginReducer.privateKey = state.loginReducer.privateKey;
  }
  if (state.loginReducer.publicKey) {
    savableState.loginReducer.publicKey = state.loginReducer.publicKey;
  }
  if (state.loginReducer.didAlias) {
    savableState.loginReducer.didAlias = state.loginReducer.didAlias;
  }
  if (state.loginReducer.nip05DomainName) {
    savableState.loginReducer.nip05DomainName =
      state.loginReducer.nip05DomainName;
  }
  return savableState;
}

export function toRootState(state: SavableRootState): RootState {
  function createGetPublicKey(mode: LoginMode) {
    switch (mode) {
      case LoginMode.local:
        return async () => {
          return state.loginReducer.publicKey!;
        };

      case LoginMode.nip07Wallet:
        return async () => {
          const pk = await window.nostr?.getPublicKey()!;
          return pk;
        };

      case LoginMode.dotbit:
        return async () => {
          if (state.loginReducer.didAlias == null) {
            throw new Error('state.loginReducer.didAlias == null');
          }
          const pk = await requestPublicKeyFromDotBit(
            state.loginReducer.didAlias,
          );
          return pk;
        };

      case LoginMode.nip05Domain:
        return async () => {
          if (state.loginReducer.nip05DomainName == null) {
            throw new Error('state.loginReducer.nip05DomainName == null');
          }
          const pk = await requestPublicKeyFromNip05DomainName(
            state.loginReducer.nip05DomainName,
          );
          return pk;
        };

      default:
        throw new Error('unsupported mode');
    }
  }

  function createSignEvent(mode: LoginMode) {
    switch (mode) {
      case LoginMode.local:
        const privKey = state.loginReducer.privateKey;
        return privKey && privKey?.length > 0
          ? async (raw: RawEvent) => {
              return await raw.toEvent(privKey);
            }
          : undefined;

      case LoginMode.nip07Wallet:
        return async (raw: RawEvent) => {
          return await window.nostr!.signEvent(raw);
        };

      case LoginMode.dotbit:
        return undefined;

      case LoginMode.nip05Domain:
        return undefined;
      default:
        throw new Error('unsupported mode');
    }
  }

  const loginReducer: any = {
    mode: state.loginReducer.mode,
    isLoggedIn: state.loginReducer.isLoggedIn,
    getPublicKey: createGetPublicKey.bind(global)(state.loginReducer.mode),
    signEvent: createSignEvent(state.loginReducer.mode),
  };
  if (state.loginReducer.privateKey) {
    loginReducer.privateKey = state.loginReducer.privateKey;
  }
  if (state.loginReducer.publicKey) {
    loginReducer.publicKey = state.loginReducer.publicKey;
  }
  if (state.loginReducer.didAlias) {
    loginReducer.didAlias = state.loginReducer.didAlias;
  }
  if (state.loginReducer.nip05DomainName) {
    loginReducer.nip05DomainName = state.loginReducer.nip05DomainName;
  }

  const rootState: RootState = {
    ...state,
    ...{
      loginReducer,
    },
  };

  return rootState;
}

export function writeStore(data: RootState) {
  const str = JSON.stringify(toSavableRootState(data));
  localStorage.setItem('store', str);
}

export function readStore(): RootState | any {
  // next.js server not localStorage
  // if (!localStorage) return {};

  // TODO: ReferenceError: localStorage is not defined
  const storedStateString = undefined; // localStorage.getItem('store');
  let storedState: SavableRootState | undefined;
  try {
    storedState = storedStateString ? JSON.parse(storedStateString) : undefined;
    if (storedState) {
      if (storedState.loginReducer.mode == null) {
        // patch for v0.1.0 version
        storedState.loginReducer.mode = LoginMode.local;
      }
      return toRootState(storedState);
    }
  } catch (error) {
    console.error('Error loading state from local storage:', error);
  }

  return {};
}

// Function to Load the store from local storage if it exists
const loadStore = () => {
  const store = readStore();
  return store;
};

export function configureAppStore() {
  const reduxSagaMonitorOptions = {};
  const sagaMiddleware = createSagaMiddleware(reduxSagaMonitorOptions);
  const { run: runSaga } = sagaMiddleware;

  // Create the store with saga middleware
  const middlewares = [sagaMiddleware, thunk];

  const enhancers = [
    createInjectorsEnhancer({
      createReducer,
      runSaga,
    }),
  ] as StoreEnhancer[];

  const rootReducer = createReducer<RootState>({
    loginReducer: loginReducer,
    relayReducer: relayReducer,
    // ... other reducers
  });

  const store = configureStore({
    reducer: rootReducer,
    middleware: [...getDefaultMiddleware(), ...middlewares],
    devTools: process.env.NODE_ENV !== 'production',
    enhancers,
    preloadedState: loadStore(),
  });

  // todo: add version control
  // Function to save the store to local storage
  const saveStore = () => {
    const state = store.getState();
    writeStore(state);
  };
  // Subscribe to the store and save it to local storage every time it updates
  // todo: only save when close the page
  store.subscribe(saveStore);

  return store;
}

export type AppStore = ReturnType<typeof configureAppStore>;
export const wrapper = createWrapper<AppStore>(configureAppStore);