import DOMPurify from 'dompurify';
import { isEventETag, isEventPTag, PublicKey } from 'service/api';
import { FlycatShareHeader } from './flycat-protocol';

export function normalizeContent(text: string): {
  imageUrls: string[];
  modifiedText: string;
} {
  // First, use a regular expression to find all URLs that start with "http" or "https"
  const urlRegex = /https?:\/\/\S+/g;
  const matches = text.match(urlRegex);

  // Initialize the imageUrls array to an empty array
  let imageUrls: string[] = [];

  // If matches were found, filter out any URLs that do not end with a common image file extension
  if (matches) {
    const imageFileExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.bmp',
      'webp',
    ];
    imageUrls = matches.filter(url =>
      imageFileExtensions.some(ext => url.endsWith(ext)),
    );
  }

  // Replace all the image URLs with an empty string
  let modifiedText = text;
  for (const url of imageUrls) {
    modifiedText = modifiedText.replace(url, '');
  }

  // Add link to url
  modifiedText = linkify(modifiedText);

  modifiedText = DOMPurify.sanitize(modifiedText);
  DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    // set all elements owning target to target=_blank
    if ('target' in node) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener');
    }
  });

  return { imageUrls, modifiedText };
}

export function linkify(content: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return content.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
}

// only return the last url
export function getShareContentUrl(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = text.match(urlRegex);
  if (match) {
    const matches = Array.from(match);
    if (matches.length > 0) {
      return matches[matches.length - 1];
    }
  }
  return null;
}

export function isValidWssUrl(url: string): boolean {
  // First, check if the URL starts with "wss://"
  if (!url.startsWith('wss://') && !url.startsWith('ws://')) {
    return false;
  }

  // Next, check if the URL contains any characters that are not allowed in
  // a URL, such as spaces or control characters
  const illegalCharacters = /[\s\u0000-\u001F\u007F-\u009F]/;
  if (illegalCharacters.test(url)) {
    return false;
  }

  // Finally, check if the URL has a valid domain name using a regular expression
  // todo: enable this for ws:// since we have private backup relay
  // const domainNameRegex =
  //   /^wss:\/\/(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  //
  // return domainNameRegex.test(url);
  return true;
}

export const getLastPubKeyFromPTags = (tags: any[]) => {
  const pks = tags.filter(t => isEventPTag(t)).map(t => t[1]);
  if (pks.length > 0) {
    return pks[pks.length - 1] as string;
  } else {
    return null;
  }
};

export const getLastEventIdFromETags = (tags: any[]) => {
  const ids = tags.filter(t => isEventETag(t)).map(t => t[1]);
  if (ids.length > 0) {
    return ids[ids.length - 1] as string;
  } else {
    return null;
  }
};

export const getPkFromFlycatShareHeader = (header: FlycatShareHeader) => {
  return header[4];
};

export const shortPublicKey = (key: PublicKey | undefined) => {
  if (key) {
    return key.slice(0, 3) + '..' + key.slice(key.length - 3);
  } else {
    return 'unknown';
  }
};

export function equalMaps(map1: Map<string, any>, map2: Map<string, any>) {
  var testVal;
  if (map1.size !== map2.size) {
    return false;
  }
  const map1Arr = Array.from(map1.entries());
  for (var [key, val] of map1Arr) {
    testVal = map2.get(key);
    // in cases of an undefined value, make sure the key
    // actually exists on the object so there are no false positives
    if (testVal !== val || (testVal === undefined && !map2.has(key))) {
      return false;
    }
  }
  return true;
}

export function maxStrings(str: string, maxLen: number = 100) {
  if (str == null) {
    return str;
  }
  if (str.length > maxLen) {
    return str.slice(0, maxLen) + '..';
  } else {
    return str;
  }
}
