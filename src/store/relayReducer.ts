import { Reducer } from 'redux';

export interface RelayStoreType {
  [pubKey: string]: string[]; // ulr[]
}

const initialState: RelayStoreType = {};

export const ADD_URL_TO_PUBLIC_KEY = 'ADD_URL_TO_PUBLIC_KEY';
export const REMOVE_URL_FROM_PUBLIC_KEY = 'REMOVE_URL_FROM_PUBLIC_KEY';

interface AddUrlToPublicKeyAction {
  type: typeof ADD_URL_TO_PUBLIC_KEY;
  payload: {
    publicKey: string;
    url: string;
  };
}

interface RemoveUrlFromPublicKeyAction {
  type: typeof REMOVE_URL_FROM_PUBLIC_KEY;
  payload: {
    publicKey: string;
    url: string;
  };
}

type ActionTypes = AddUrlToPublicKeyAction | RemoveUrlFromPublicKeyAction;

export const relayReducer: Reducer<RelayStoreType, ActionTypes> = (
  state = initialState,
  action: ActionTypes,
) => {
  switch (action.type) {
    case ADD_URL_TO_PUBLIC_KEY: {
      const { publicKey, url } = action.payload;
      const relay: RelayStoreType = deepCopy(state); // deep copy
      if (relay[publicKey]?.includes(url)) {
        // do not add duplicated url
        console.log(`relay ${url} already exits!`);
        return relay;
      }

      relay[publicKey] = relay[publicKey]?.concat(url) || [url];
      return relay;
    }
    case REMOVE_URL_FROM_PUBLIC_KEY: {
      const { publicKey, url } = action.payload;
      const relay: RelayStoreType = deepCopy(state); // deep copy
      const urls = state[publicKey];
      if (!urls) {
        return state;
      }
      relay[publicKey] = urls.filter(u => u !== url);
      return relay;
    }
    default: {
      return state;
    }
  }
};

// todo: can not handle like undefine or function nested
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
