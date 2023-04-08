import { Pool } from './pool';

export function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms),
  );
}

export function delay(ms: number): Promise<string> {
  return new Promise((resolve, _) =>
    setTimeout(() => resolve('time ends'), ms),
  );
}

export function waitUntilAtLeastOneConnected(pool: Pool) {
  const limit = 20;
  return new Promise((resolve, reject) => {
    let count = 0;
    const checkConnectionStatus = () => {
      count++;
      if (count > limit) reject(new Error('time out'));
      if (Array.from(pool.wsConnectStatus.values()).includes(true)) {
        resolve(true);
      } else {
        setTimeout(checkConnectionStatus, 50); // wait 100 mil second before checking again
      }
    };
    checkConnectionStatus();
  });
}
