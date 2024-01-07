// take and adapt from https://github.com/v0l/snort

export interface ParsedFragment {
  type:
    | 'text'
    | 'link'
    | 'media'
    | 'mention'
    | 'lnUrls'
    | 'bolt11Invoices'
    | 'hashtag'
    | 'custom_emoji';
  content: string;
  mimeType?: string;
  language?: string;
}

export type Fragment = string | ParsedFragment;

export const FileExtensionRegex = /\.([\w]{1,7})$/i;
export const MentionNostrEntityRegex =
  /(nostr:npub[acdefghjklmnpqrstuvwxyz0123456789]+|nostr:nprofile[acdefghjklmnpqrstuvwxyz0123456789]+|nostr:nevent[acdefghjklmnpqrstuvwxyz0123456789]+|nostr:note[acdefghjklmnpqrstuvwxyz0123456789]+|nostr:naddr[acdefghjklmnpqrstuvwxyz0123456789]+|nostr:nrelay[acdefghjklmnpqrstuvwxyz0123456789]+)/g;
export const InvoiceRegex =
  /(lnbc|lntb|lntbs)[A-Za-z0-9]+(\d+([munp])|\d+x\d+([munp]))?/i;
export const lnUrlRegex = /,*?((lnurl)([0-9]{1,}[a-z0-9]+){1})/g;
export const HashtagRegex = /(#[^\s!@#$%^&*()=+.\/,\[{\]};:'"?><]+)/g;

export function splitByUrl(str: string) {
  const urlRegex =
    /((?:http|ftp|https|magnet):\/?\/?(?:[\w+?.\w+])+(?:[\p{L}\p{N}~!@#$%^&*()_\-=+\\/?.:;',]*)?(?:[-a-z0-9+&@#/%=~()_|]))/iu;
  return str.split(urlRegex);
}

export function extractLinks(fragments: Fragment[]) {
  return fragments
    .map(f => {
      if (typeof f === 'string') {
        return splitByUrl(f).map(a => {
          const validateLink = () => {
            const normalizedStr = a.toLowerCase();
            return (
              normalizedStr.startsWith('http:') ||
              normalizedStr.startsWith('https:')
            );
          };

          if (validateLink()) {
            const url = new URL(a);
            const extension = url.pathname.match(FileExtensionRegex);

            if (extension && extension.length > 1) {
              const mediaType = (() => {
                switch (extension[1]) {
                  case 'gif':
                  case 'jpg':
                  case 'jpeg':
                  case 'jfif':
                  case 'png':
                  case 'bmp':
                  case 'webp':
                    return 'image';
                  case 'wav':
                  case 'mp3':
                  case 'ogg':
                    return 'audio';
                  case 'mp4':
                  case 'mov':
                  case 'mkv':
                  case 'avi':
                  case 'm4v':
                  case 'webm':
                  case 'm3u8':
                    return 'video';
                  default:
                    return 'unknown';
                }
              })();
              return {
                type: 'media',
                content: a,
                mimeType: `${mediaType}/${extension[1]}`,
              } as ParsedFragment;
            } else {
              return {
                type: 'link',
                content: a,
              } as ParsedFragment;
            }
          }
          return a;
        });
      }
      return f;
    })
    .flat();
}

export function extractMentions(fragments: Fragment[]) {
  return fragments
    .map(f => {
      if (typeof f === 'string') {
        return f.split(MentionNostrEntityRegex).map(i => {
          if (MentionNostrEntityRegex.test(i)) {
            return {
              type: 'mention',
              content: i,
            } as ParsedFragment;
          } else {
            return i;
          }
        });
      }
      return f;
    })
    .flat();
}

export function extractInvoices(fragments: Fragment[]) {
  return fragments
    .map(f => {
      if (typeof f === 'string') {
        return f.split(InvoiceRegex).map(i => {
          if (i.toLowerCase().startsWith('lnbc')) {
            return {
              type: 'bolt11Invoices',
              content: i,
            } as ParsedFragment;
          } else {
            return i;
          }
        });
      }
      return f;
    })
    .flat();
}

export function extractLnUrlInvoices(fragments: Fragment[]) {
  return fragments
    .map(f => {
      if (typeof f === 'string') {
        return f.split(lnUrlRegex).map(i => {
          if (i.toLowerCase().startsWith('lnurl')) {
            return {
              type: 'lnUrls',
              content: i,
            } as ParsedFragment;
          } else {
            return i;
          }
        });
      }
      return f;
    })
    .flat();
}

export function extractHashtags(fragments: Fragment[]) {
  return fragments
    .map(f => {
      if (typeof f === 'string') {
        return f.split(HashtagRegex).map(i => {
          if (i.toLowerCase().startsWith('#')) {
            return {
              type: 'hashtag',
              content: i.substring(1),
            } as ParsedFragment;
          } else {
            return i;
          }
        });
      }
      return f;
    })
    .flat();
}

export function extractCustomEmoji(
  fragments: Fragment[],
  tags: Array<Array<string>>,
) {
  return fragments
    .map(f => {
      if (typeof f === 'string') {
        return f.split(/:(\w+):/g).map(i => {
          const t = tags.find(a => a[0] === 'emoji' && a[1] === i);
          if (t) {
            return {
              type: 'custom_emoji',
              content: t[2],
            } as ParsedFragment;
          } else {
            return i;
          }
        });
      }
      return f;
    })
    .flat();
}

export function transformText(body: string, tags: Array<Array<string>>) {
  let fragments = extractLinks([body]);
  fragments = extractMentions(fragments);
  fragments = extractHashtags(fragments);
  fragments = extractInvoices(fragments);
  fragments = extractCustomEmoji(fragments, tags);
  fragments = removeUndefined(
    fragments.map(a => {
      if (typeof a === 'string') {
        if (a.length > 0) {
          return { type: 'text', content: a } as ParsedFragment;
        }
      } else {
        return a;
      }
    }),
  );
  return fragments as Array<ParsedFragment>;
}

export function removeUndefined<T>(v: Array<T | undefined>) {
  return v.filter(a => a != undefined).map(a => unwrap(a));
}

export function unwrap<T>(v: T | undefined | null): T {
  if (v === undefined || v === null) {
    throw new Error('missing value');
  }
  return v;
}
