import DOMPurify from 'dompurify';
import { isEventETag, isEventPTag, PublicKey } from 'service/api';
import { FlycatShareHeader } from './flycat-protocol';

export function normalizeContent(text: string): {
  lnUrls: string[];
  bolt11Invoices: string[];
  imageUrls: string[];
  videoUrls: string[];
  audioUrls: string[];
  previewUrls: string[];
  modifiedText: string;
} {
  // First, use a regular expression to find all URLs that start with "http" or "https"
  const urlRegex = /(https?):\/\/[^\s/$.?#].[^\s]*/gm;
  const matches = text.match(urlRegex);

  // Initialize the imageUrls, videoUrls, and audioUrls arrays to empty arrays
  let imageUrls: string[] = [];
  let videoUrls: string[] = [];
  let audioUrls: string[] = [];

  // If matches were found, filter out any URLs that end with common image, video, or audio file extensions
  if (matches) {
    const imageFileExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.bmp',
      '.webp',
    ];
    const videoFileExtensions = [
      '.mp4',
      '.mov',
      '.avi',
      '.flv',
      '.wmv',
      'webm',
    ];
    const audioFileExtensions = ['.mp3', '.m4a', '.ogg', '.wav', '.flac'];
    imageUrls = matches.filter(url =>
      imageFileExtensions.some(ext => url.endsWith(ext)),
    );
    videoUrls = matches.filter(url =>
      videoFileExtensions.some(ext => url.endsWith(ext)),
    );
    audioUrls = matches.filter(url =>
      audioFileExtensions.some(ext => url.endsWith(ext)),
    );
  }

  // Replace all the image, video, and audio URLs with an empty string
  let modifiedText = text;
  for (const url of imageUrls.concat(videoUrls).concat(audioUrls)) {
    modifiedText = modifiedText.replace(url, '');
  }

  const lnUrls = extractLnUrlInvoiceString(modifiedText);
  for (const str of lnUrls) {
    modifiedText = modifiedText.replace(str.toUpperCase(), '');
  }

  const bolt11Invoices = extractBolt11InvoiceString(modifiedText);
  for (const str of bolt11Invoices) {
    modifiedText = modifiedText.replace(str, '');
  }

  // Add link to url
  //modifiedText = linkify(modifiedText);
  const previewUrls = extractUrls(modifiedText);

  const allowedTags = ['a'];
  modifiedText = DOMPurify.sanitize(modifiedText, {
    ALLOWED_TAGS: allowedTags,
  });

  DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    // set all elements owning target to target=_blank
    if ('target' in node) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener');
    }
  });

  return {
    lnUrls,
    bolt11Invoices,
    imageUrls,
    videoUrls,
    audioUrls,
    previewUrls,
    modifiedText,
  };
}

export function linkify(content: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return content.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
}

function extractUrls(text: string): string[] {
  const urlRegex =
    /(https?):\/\/[a-zA-Z0-9-.]+\.[a-zA-Z]{2,}(\/[^\\<>{}|;'"`()\s]*)?/gm;
  return text.match(urlRegex) || [];
}

function extractBolt11InvoiceString(text: string): string[] {
  //const regex = /^(lnbc|lntb|lntbs)[A-Za-z0-9]+(\d+(x\d+)?[munp])?$/gm;
  const regex = /(lnbc|lntb|lntbs)[A-Za-z0-9]+(\d+([munp])|\d+x\d+([munp]))?/g;
  return text.match(regex) || [];
}

function extractLnUrlInvoiceString(text: string): string[] {
  text = text.toLowerCase();
  const regex = /,*?((lnurl)([0-9]{1,}[a-z0-9]+){1})/g;
  return text.match(regex) || [];
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

// invalid string including ""
export function isEmptyStr(text?: string) {
  return text == null || text.length === 0;
}

export function isNip05DomainName(name: string): boolean {
  // Regular expression pattern for email validation
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return regex.test(name);
}

export function isDotBitName(name: string): boolean {
  return name.endsWith('.bit');
}

export function formatDate(secs: number): string {
  const date = new Date(secs * 1000); // Convert seconds to milliseconds
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2); // Add leading zero if necessary
  const day = ('0' + date.getDate()).slice(-2); // Add leading zero if necessary
  const hours = ('0' + date.getHours()).slice(-2); // Add leading zero if necessary
  const minutes = ('0' + date.getMinutes()).slice(-2); // Add leading zero if necessary
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
