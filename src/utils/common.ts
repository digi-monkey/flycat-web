import { v4 as uuidv4 } from 'uuid';

export const getDraftId = () => uuidv4();

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
