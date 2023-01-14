import {
  PublicKey,
  Filter,
  Event,
  EventId,
  isEventPTag,
  isEventETag,
} from 'service/api';
import {
  ToWorkerMessage,
  workerEventEmitter,
  ToWorkerMessageType,
  FromWorkerMessage,
  FromWorkerMessageType,
} from './wsApi';

export const addRelays = async (relays: string[]) => {
  const msg: ToWorkerMessage = {
    urls: relays,
  };
  workerEventEmitter.emit(ToWorkerMessageType.ADD_RELAY_URL, msg);
};

export const subFilter = async (filter: Filter) => {
  const msg: ToWorkerMessage = {
    callMethod: 'subFilter',
    callData: [filter],
  };
  workerEventEmitter.emit(ToWorkerMessageType.CALL_API, msg);
};

export const subMsg = async (pks: PublicKey[]) => {
  const filter: Filter = {
    authors: pks,
    limit: 50,
  };
  const msg: ToWorkerMessage = {
    callMethod: 'subFilter',
    callData: [filter],
  };
  workerEventEmitter.emit(ToWorkerMessageType.CALL_API, msg);
};

export const subMsgByEventIds = async (eventIds: EventId[]) => {
  const filter: Filter = {
    ids: eventIds,
    limit: 50,
  };
  const msg: ToWorkerMessage = {
    callMethod: 'subFilter',
    callData: [filter],
  };
  workerEventEmitter.emit(ToWorkerMessageType.CALL_API, msg);
};

export const subMsgByETags = async (eventIds: EventId[]) => {
  const filter: Filter = {
    '#e': eventIds,
    limit: 50,
  };
  const msg: ToWorkerMessage = {
    callMethod: 'subFilter',
    callData: [filter],
  };
  workerEventEmitter.emit(ToWorkerMessageType.CALL_API, msg);
};

export const subMetadata = async (pks: PublicKey[]) => {
  const msg: ToWorkerMessage = {
    callMethod: 'subUserMetadata',
    callData: [pks],
  };
  workerEventEmitter.emit(ToWorkerMessageType.CALL_API, msg);
};

export const subContactList = async (publicKey: PublicKey) => {
  const msg: ToWorkerMessage = {
    callMethod: 'subUserContactList',
    callData: [publicKey],
  };
  workerEventEmitter.emit(ToWorkerMessageType.CALL_API, msg);
};

export const subUserRecommendServer = async (pks: PublicKey[]) => {
  const msg: ToWorkerMessage = {
    callMethod: 'subUserRelayer',
    callData: [pks],
  };
  workerEventEmitter.emit(ToWorkerMessageType.CALL_API, msg);
};

export const subBlogSiteMetadata = async (pks: PublicKey[]) => {
  const msg: ToWorkerMessage = {
    callData: [pks],
    callMethod: 'subUserSiteMetadata',
  };
  workerEventEmitter.emit(ToWorkerMessageType.CALL_API, msg);
};

export const pubEvent = async (event: Event) => {
  const msg: ToWorkerMessage = {
    callMethod: 'pubEvent',
    callData: [event],
  };
  workerEventEmitter.emit(ToWorkerMessageType.CALL_API, msg);
};

export const listenFromWsApiWorker = async (
  onWsConnStatus?: (message: FromWorkerMessage) => any,
  onNostrData?: (message: FromWorkerMessage) => any,
) => {
  if (onWsConnStatus) {
    workerEventEmitter.on(FromWorkerMessageType.WS_CONN_STATUS, onWsConnStatus);
  }
  if (onNostrData) {
    workerEventEmitter.on(FromWorkerMessageType.NostrData, onNostrData);
  }
};

export const getLastPubKeyFromPTags = (tags: any[]) => {
  const pks = tags.filter(t => isEventPTag(t)).map(t => t[1]);
  if (pks.length > 0) {
    return pks[pks.length - 1] as string;
  } else {
    return null;
  }
};

export const getLastEventIdFromETags = (tags: any[]) => {
  const ids = tags.filter(t => isEventETag(t)).map(t => t[1]);
  if (ids.length > 0) {
    return ids[ids.length - 1] as string;
  } else {
    return null;
  }
};

export const shortPublicKey = (key: PublicKey | undefined) => {
  if (key) {
    return key.slice(0, 8) + '..' + key.slice(48);
  } else {
    return 'unknown';
  }
};
