export type WsConnectStatus = Map<string, boolean>;

export enum ToWorkerMessageType {
  ADD_RELAY_URL = 'addRelayUrl',
  PULL_RELAY_STATUS = 'pullRelayStatus',
  DISCONNECT = 'disconnect',
  CALL_API = 'execApiMethod',
}

export interface ToWorkerMessageData {
  urls?: string[];
  callMethod?: string;
  callData?: any[];
}

export enum FromWorkerMessageType {
  WS_CONN_STATUS = 'wsConnectStatus',
  NostrData = 'nostrData',
}

export interface FromWorkerMessageData {
  wsConnectStatus?: WsConnectStatus;
  nostrData?: any;
}

export interface ToPostMsg {
  data: ToWorkerMessageData;
  type: ToWorkerMessageType;
}

export interface FromPostMsg {
  data: FromWorkerMessageData;
  type: FromWorkerMessageType;
}
