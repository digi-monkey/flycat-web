/**
 * Create the store with dynamic reducers
 */

import {
  configureStore,
  getDefaultMiddleware,
  StoreEnhancer,
} from '@reduxjs/toolkit';
import { createInjectorsEnhancer } from 'redux-injectors';
import createSagaMiddleware from 'redux-saga';
import { LoginMode, loginReducer } from './loginReducer';

import { createReducer } from './reducers';
import { relayReducer } from './relayReducer';
import thunk from 'redux-thunk';
import { RawEvent } from 'service/api';

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
  return savableState;
}

export function toRootState(state: SavableRootState): RootState {
  function createGetPublicKey(mode: LoginMode) {
    switch (mode) {
      case LoginMode.local:
        return async () => {
          return state.loginReducer.publicKey!;
        };

      case LoginMode.nip07:
        return async () => {
          const pk = await window.nostr?.getPublicKey()!;
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

      case LoginMode.nip07:
        return async (raw: RawEvent) => {
          return await window.nostr!.signEvent(raw);
        };

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
  const storedStateString = localStorage.getItem('store');
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
  return readStore();
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
