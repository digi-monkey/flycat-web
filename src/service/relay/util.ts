import { Relay } from './type';

export function isRelayOutdate(relay: Relay) {
  const threshold = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
  const currentTime = new Date().getTime();
  if (relay.lastUpdateTimestamp) {
    const difference = relay.lastUpdateTimestamp - currentTime;
    return difference > threshold;
  }

  return true;
}

export function newRelay(url: string): Relay {
  return {
    read: true,
    write: true,
    url,
  };
}
