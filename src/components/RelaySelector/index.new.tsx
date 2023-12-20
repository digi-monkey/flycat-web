import { WsConnectStatus } from 'core/worker/type';

export interface RelaySelectorProps {
  wsStatusCallback?: (WsConnectStatus: WsConnectStatus) => any;
  newConnCallback?: (conns: string[]) => any;
  className?: string;
}

export function RelaySelector() {}
