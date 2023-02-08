export type WsConnectStatus = Map<string, boolean>;

// specify which relay to execute the operation
export enum CallRelayType {
  all, // all relays
  connected, // only connected relays -> default
  single, // single specific relay
  batch, // multiple specific relays in an array
}

export enum ToWorkerMessageType {
  ADD_RELAY_URL = 'addRelayUrl',
  PULL_RELAY_STATUS = 'pullRelayStatus',
  DISCONNECT = 'disconnect',
  CALL_API = 'execApiMethod',
  CLOSE_PORT = 'closePort',
}

export interface ToWorkerMessageData {
  urls?: string[];

  // call api
  callMethod?: string;
  callData?: any[];
  callRelayType?: CallRelayType;
  callRelayUrls?: string[];

  portId: number;
}

export enum FromWorkerMessageType {
  PORT_ID = 'portId',
  WS_CONN_STATUS = 'wsConnectStatus',
  NOSTR_DATA = 'nostrData',
}

export interface FromWorkerMessageData {
  wsConnectStatus?: WsConnectStatus;
  nostrData?: any;
  portId?: number;
}

export interface ToPostMsg {
  data: ToWorkerMessageData;
  type: ToWorkerMessageType;
}

export interface FromPostMsg {
  data: FromWorkerMessageData;
  type: FromWorkerMessageType;
}
