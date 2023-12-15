import { generateRandomBytes } from 'core/crypto';
import { DbEvent } from 'core/db/schema';
import { HexStr } from 'types';
import { v4 as uuidv4 } from 'uuid';
import { isValidNpub, isValidPublicKey } from './validator';
import { isNip05DomainName } from 'core/nip/05';
import { getPublicKeyFromDotBit, isDotBitName } from 'core/dotbit';
import { Nip19, Nip19DataType } from 'core/nip/19';
import { PublicKey } from 'core/nostr/type';

export const getDraftId = () => uuidv4();

export function randomSubId(size = 8): HexStr {
  return generateRandomBytes(size);
}

export function getRandomIndex(array: any[]) {
  return Math.floor(Math.random() * array.length);
}

export const stringHasImageUrl = str => {
  const imageUrlRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif))/i;
  return str.split(' ').some(word => imageUrlRegex.test(word));
};

export function maxStrings(str: string, maxLen = 100) {
  if (str == null) {
    return str;
  }
  if (str.length > maxLen) {
    return str.slice(0, maxLen) + '..';
  } else {
    return str;
  }
}

export function getBaseUrl(str: string) {
  const url = new URL(str);
  const baseUrl = url.hostname;
  return baseUrl;
}

export const copyToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text);
};

export function isOnlyWhitespaceString(str: string): boolean {
  return /^\s*$/.test(str);
}

export function displayTwoDigitNumber(num: number): string {
  if (num < 10) {
    return `0${num}`;
  } else {
    return num.toString();
  }
}

export function normalizeWsUrl(url: string): string {
  const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  return normalizedUrl;
}

export function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const chunkedArray: T[][] = [];

  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk: T[] = arr.slice(i, i + chunkSize);
    chunkedArray.push(chunk);
  }

  return chunkedArray;
}

export function mergeAndSortUniqueDbEvents(
  array1: DbEvent[],
  array2: DbEvent[],
): DbEvent[] {
  // Merge the arrays while ensuring uniqueness based on the 'id' property
  const mergedArray: DbEvent[] = [...array1, ...array2].reduce(
    (uniqueArray: DbEvent[], currentItem) => {
      if (!uniqueArray.some(item => item.id === currentItem.id)) {
        uniqueArray.push(currentItem);
      }
      return uniqueArray;
    },
    [],
  );

  // Sort the merged array by 'created_at' in descending order
  mergedArray.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return mergedArray;
}

export async function parsePublicKeyFromUserIdentifier(
  userId: string | undefined,
) {
  if (userId) {
    if (isValidPublicKey(userId)) {
      return userId;
    }

    if (isValidNpub(userId)) {
      const npub = parseNpub(userId);
      return npub;
    }

    if (isNip05DomainName(userId)) {
      const pk = await requestPublicKeyFromNip05DomainName(userId);
      if (isValidPublicKey(pk)) {
        return pk;
      }
    }

    if (isDotBitName(userId)) {
      const pk = await requestPublicKeyFromDotBit(userId);
      if (isValidPublicKey(pk)) {
        return pk;
      }
    }
  }
  return null;
}

export async function requestPublicKeyFromDotBit(
  didAlias: string,
): Promise<string> {
  if (!didAlias.endsWith('.bit')) {
    throw new Error('dotbit alias must ends with .bit');
  }

  const pk = await getPublicKeyFromDotBit(didAlias);
  if (pk == null) {
    throw new Error('nostr key value not found in' + didAlias);
  }
  return pk;
}

export async function requestPublicKeyFromNip05DomainName(
  domainName: string,
): Promise<string> {
  if (!domainName.includes('@')) {
    throw new Error('invalid domain name! not including @');
  }

  const username = domainName.split('@')[0];
  const website = domainName.split('@')[1];

  const response = await fetch(
    `https://${website}/.well-known/nostr.json?name=${username}`,
  );
  const data = await response.json();
  if (data == null || data.names == null) {
    throw new Error('invalid domain for nip05 ' + domainName);
  }
  const pk = data.names[username];
  if (pk == null) {
    throw new Error('invalid username for nip05 ' + domainName);
  }

  return pk;
}

export function parseNpub(npub: string) {
  try {
    const res = Nip19.decode(npub);
    if (res.type !== Nip19DataType.Npubkey) {
      throw new Error('invalid npub parse result,  ' + res.data);
    }
    return res.data as PublicKey;
  } catch (error: any) {
    throw new Error('parse npub failed,  ' + error.message);
  }
}
