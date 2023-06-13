import { v4 as uuidv4 } from 'uuid';

export const getDraftId = () => uuidv4();

export const stringHasImageUrl = (str) => {
  const imageUrlRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif))/i;
  return str.split(' ').some((word) => imageUrlRegex.test(word));
};
