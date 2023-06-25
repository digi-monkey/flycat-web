import { EventId, Filter, SubscriptionId } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { Relay } from 'core/relay/type';

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
  id: string;
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

//-----
export type FromConsumerMsg =
  | { type: FromConsumerMsgType.subFilter; data: SubFilterMsg }
  | { type: FromConsumerMsgType.pubEvent; data: PubEventMsg }
  | { type: FromConsumerMsgType.switchRelays; data: SwitchRelayMsg }
  | { type: FromConsumerMsgType.pullRelayInfo; data: PullRelayInfoMsg }
  | { type: FromConsumerMsgType.disconnect; data: DisconnectMsg }
  | { type: FromConsumerMsgType.closePort; data: ClosePortMsg }

export enum FromConsumerMsgType {
  subFilter,
  pubEvent,
  switchRelays,
  pullRelayInfo,
  closePort,
  disconnect
}

export interface SubFilterMsg {
  portId: number;
  filter: Filter;
  callRelay: CallRelay;
  subId: SubscriptionId;
}

export interface PubEventMsg {
  portId: number;
  event: Event;
  callRelay: CallRelay;
}

export interface SwitchRelayMsg {
  portId: number;
  switchRelays: SwitchRelays;
}

export interface PullRelayInfoMsg {
  portId: number;
}

export interface DisconnectMsg {
  portId: number;
}

export interface ClosePortMsg {
  portId: number;
}


//----
export type FromProducerMsg =
  | { type: FromProducerMsgType.event; data: SubFilterResultMsg }
  | { type: FromProducerMsgType.pubResult; data: PubEventResultMsg }
  | { type: FromProducerMsgType.portId; data: PortIdMsg }
  | {type: FromProducerMsgType.relayInfo, data: RelayInfoMsg }

export enum FromProducerMsgType {
  event,
  pubResult,
  portId,
  relayInfo,
  notice,
  authChallenge
}

export interface SubFilterResultMsg {
  event: Event;
  subId: SubscriptionId;
  relayUrl: string;
  portId: number;
}

export interface PubEventResultMsg {
  eventId: EventId;
  isSuccess: boolean;
  reason?: string;
  portId: number;
  relayUrl: string;
}

export interface PortIdMsg {
  portId: number;
}

export interface RelayInfoMsg {
  wsConnectStatus: WsConnectStatus;
  id: string;
  relays: Relay[];
  portId: number;
}

