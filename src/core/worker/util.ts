import { CallRelay, CallRelayType } from './type';

export function createCallRelay(newConn: string[]): CallRelay {
  const type =
    newConn.length > 0 ? CallRelayType.connected : CallRelayType.batch;
  return {
    type,
    data: newConn,
  };
}
