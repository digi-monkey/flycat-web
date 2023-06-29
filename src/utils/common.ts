import { generateRandomBytes } from 'core/crypto';
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
