const tempMyPkItemKey = 'temp.myPublicKey';

export function saveTempMyPublicKey(pk: string | undefined) {
  if (pk == null || pk.length === 0) return;
  localStorage.setItem(tempMyPkItemKey, pk);
}

export function loadTempMyPublicKey() {
  return localStorage.getItem(tempMyPkItemKey);
}

export function clearTempMyPublicKey() {
  if (loadTempMyPublicKey() != null) localStorage.removeItem(tempMyPkItemKey);
}
