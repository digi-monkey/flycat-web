export function isValidPublicKey(key: any): boolean {
  return (
    typeof key === 'string' && key.length === 64 && /^[0-9a-fA-F]+$/.test(key)
  );
}
