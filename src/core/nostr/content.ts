import { isValidPublicKey } from 'utils/validator';
import { isOnlyWhitespaceString, maxStrings } from 'utils/common';
import { EventSetMetadataContent, PublicKey } from './type';
import DOMPurify from 'dompurify';

export function deserializeMetadata(content: string): EventSetMetadataContent {
  const metadata: EventSetMetadataContent = JSON.parse(content);
  return normalizeMetadata(metadata);
}

export function normalizeMetadata(
  metadata: EventSetMetadataContent
): EventSetMetadataContent {
  metadata.name = maxStrings(metadata.name, 30);
  metadata.about = maxStrings(metadata.about, 500);
  return metadata;
}

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
    imageUrls = matches.filter(url => imageFileExtensions.some(ext => url.endsWith(ext))
    );
    videoUrls = matches.filter(url => videoFileExtensions.some(ext => url.endsWith(ext))
    );
    audioUrls = matches.filter(url => audioFileExtensions.some(ext => url.endsWith(ext))
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

  const allowedTags = ['a', 'div'];
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

  modifiedText = isOnlyWhitespaceString(modifiedText) ? "" : modifiedText;

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
  const urlRegex = /(https?):\/\/[a-zA-Z0-9-.]+\.[a-zA-Z]{2,}(\/[^\\<>{}|;'"`()\s]*)?/gm;
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

export const shortifyPublicKey = (key: PublicKey | undefined) => {
  if (key && isValidPublicKey(key)) {
    return key.slice(0, 3) + '..' + key.slice(key.length - 3);
  }
  if(typeof key === "string" && key.length < 8){
    return key;
  }
  if(typeof key === "string" && key.length > 8){
    return key.slice(0, 3) + '..' + key.slice(key.length - 3);
  }

  return 'Anonymous';
};
