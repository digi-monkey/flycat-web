import { HexStr } from 'types';
import { generateRandomBytes } from '../crypto';

export function newSubId(portId: number, subId: string) {
  // todo: fix the patch
  if (subId.includes(':')) return subId;

  return `${portId}:${subId}`;
}

export function getPortIdFomSubId(subId: string): number | null {
  if (!subId.includes(':')) return null;

  return +subId.split(':')[0];
}

export function randomSubId(size = 8): HexStr {
  return generateRandomBytes(size);
}
