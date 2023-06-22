import { Relay } from "core/relay/type";

export type WsConnectStatus = Map<string, boolean>;

export interface CallRelay {
  type: CallRelayType;
  data: string[];
}

// specify which relay to execute the operation
export enum CallRelayType {
  all, // all relays
  connected, // only connected relays -> default
  single, // single specific relay
  batch, // multiple specific relays in an array
}

export enum ToWorkerMessageType {
  SWITCH_RELAYS = 'switchRelays',
  ADD_RELAY_URL = 'addRelayUrl',
  GET_RELAY_GROUP_ID = 'getRelayGroupId',
  PULL_RELAY_STATUS = 'pullRelayStatus',
  DISCONNECT = 'disconnect',
  CALL_API = 'execApiMethod',
  CLOSE_PORT = 'closePort',
}

export interface SwitchRelays {
  id: string,
  relays: Relay[];
}

export interface ToWorkerMessageData {
  switchRelays?: SwitchRelays;
  urls?: string[]; // addRelay calldata

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
  RELAY_GROUP_ID = 'relayGroupId',
  NOSTR_DATA = 'nostrData',
}

export interface FromWorkerMessageData {
  relayGroupId?: string;
  wsConnectStatus?: WsConnectStatus;
  nostrData?: any;
  relayUrl?: string; // hint which relay the nostrData is coming from

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
