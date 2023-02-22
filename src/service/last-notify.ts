const KEY = 'lastNotificationTime'; // secs

const defaultTime = Math.round(Date.now() / 1000) - 3600 * 24; // one day ago

export function get(): number {
  return +(localStorage.getItem(KEY) || defaultTime);
}

export function update(secs: number) {
  return localStorage.setItem(KEY, (secs * 1000).toString());
}
