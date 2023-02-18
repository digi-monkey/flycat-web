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
import { loginReducer } from './loginReducer';

import { createReducer } from './reducers';
import { relayReducer } from './relayReducer';

// Function to Load the store from local storage if it exists
const loadStore = () => {
  const storedStateString = localStorage.getItem('store');
  let storedState;
  try {
    storedState = storedStateString ? JSON.parse(storedStateString) : undefined;
  } catch (error) {
    console.error('Error loading state from local storage:', error);
  }
  console.log(storedState);
  return storedState;
};

export function configureAppStore() {
  const reduxSagaMonitorOptions = {};
  const sagaMiddleware = createSagaMiddleware(reduxSagaMonitorOptions);
  const { run: runSaga } = sagaMiddleware;

  // Create the store with saga middleware
  const middlewares = [sagaMiddleware];

  const enhancers = [
    createInjectorsEnhancer({
      createReducer,
      runSaga,
    }),
  ] as StoreEnhancer[];

  const store = configureStore({
    reducer: createReducer({
      loginReducer: loginReducer,
      relayReducer: relayReducer,
    }),
    middleware: [...getDefaultMiddleware(), ...middlewares],
    devTools: process.env.NODE_ENV !== 'production',
    enhancers,
    preloadedState: loadStore(),
  });

  // todo: add version control
  // Function to save the store to local storage
  const saveStore = () => {
    const state = store.getState();
    const stateString = JSON.stringify(state);
    localStorage.setItem('store', stateString);
  };
  // Subscribe to the store and save it to local storage every time it updates
  // todo: only save when close the page
  store.subscribe(saveStore);

  return store;
}
