import { generateRandomBytes } from 'core/crypto';
import { DbEvent } from 'core/db/schema';
import { HexStr } from 'types';
import { v4 as uuidv4 } from 'uuid';

export const getDraftId = () => uuidv4();

export function randomSubId(size = 8): HexStr {
  return generateRandomBytes(size);
}

export function getRandomIndex(array: any[]) {
  return Math.floor(Math.random() * array.length);
}

export const stringHasImageUrl = (str) => {
  const imageUrlRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif))/i;
  return str.split(' ').some((word) => imageUrlRegex.test(word));
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

export function getBaseUrl(str: string){
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

export function mergeAndSortUniqueDbEvents(array1: DbEvent[], array2: DbEvent[]): DbEvent[] {
  // Merge the arrays while ensuring uniqueness based on the 'id' property
  const mergedArray: DbEvent[] = [...array1, ...array2].reduce((uniqueArray: DbEvent[], currentItem) => {
    if (!uniqueArray.some((item) => item.id === currentItem.id)) {
      uniqueArray.push(currentItem);
    }
    return uniqueArray;
  }, []);

  // Sort the merged array by 'created_at' in descending order
  mergedArray.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return mergedArray;
}
