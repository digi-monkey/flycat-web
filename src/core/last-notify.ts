const KEY = 'lastNotificationTime'; // secs

export const fetchSince = Math.round(Date.now() / 1000) - 3600 * 24 * 7; // 7 day ago

export function get(): number | null {
  return localStorage.getItem(KEY) ? +localStorage.getItem(KEY)! : null;
}

export function update(secs: number) {
  return localStorage.setItem(KEY, secs.toString());
}
