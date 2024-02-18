// this nip is not proposed yet
// it is focus on nostr filter scripts(wasm bytecode)
import { Event } from 'core/nostr/Event';
import { RawEvent } from 'core/nostr/RawEvent';
import { EventTags, Filter, Tags } from 'core/nostr/type';

export interface NoscriptPayload {
  title?: string;
  description?: string;
  picture?: string;
  version?: string;
  source_code?: string; // source code url
  published_at?: number; // timestamp, seconds
  runtime_version?: string;
}

export interface NoscriptContent {
  wasm: string;
  binding: string;
}

export class NoscriptContent implements NoscriptContent {
  wasm: string;
  binding: string;

  constructor(wasm: string, binding: string) {
    this.wasm = wasm;
    this.binding = binding;
  }

  parseBindingString() {
    const content = this.binding;
    const code = atob(content);
    return code;
  }

  parseWasmString() {
    const content = this.wasm;
    const code = base64ToArrayBuffer(content);
    return code;
  }
}

export enum FilterOptMode {
  global = 0,
  follow = 1,
  trustNetwork = 2, // follow's follow without spam
  signInUser = 3,
  visitingUser = 4,
  custom = 5,
}

export interface FilterOptPayload {
  filter: Filter;
  mode: FilterOptMode;
}

export class Nip188 {
  static kind = 32043; // nostr script kind
  static noscriptTagLabel = 'noscript';
  static customFilterOptLabelValue = 'wasm:msg:filter';

  static createFilterOptTags(filterOptPayload: FilterOptPayload) {
    const tags: Tags = [];
    const filter = filterOptPayload.filter;
    if (filter.ids) {
      tags.push(['ids', ...filter.ids]);
    }
    if (filter.authors) {
      tags.push(['authors', ...filter.authors]);
    }
    if (filter.kinds) {
      tags.push(['kinds', ...filter.kinds.map(k => k.toString())]);
    }
    if (filter.limit) {
      tags.push(['limit', filter.limit.toString()]);
    }
    if (filter.since) {
      tags.push(['since', filter.since.toString()]);
    }
    if (filter.until) {
      tags.push(['until', filter.until.toString()]);
    }
    if (filter['#e']) {
      tags.push(['#e', ...filter['#e']]);
    }
    if (filter['#p']) {
      tags.push(['#p', ...filter['#p']]);
    }
    if (filter['#d']) {
      tags.push(['#e', ...filter['#d']]);
    }
    if (filter['#a']) {
      tags.push(['#a', ...filter['#a']]);
    }
    if (filter['#t']) {
      tags.push(['#t', ...filter['#t']]);
    }
    tags.push(['mode', filterOptPayload.mode]);
    tags.push([this.noscriptTagLabel, this.customFilterOptLabelValue]);

    return tags;
  }

  static createNoscriptTags(payload: NoscriptPayload) {
    const tags: Tags = [];
    if (payload.title) {
      tags.push(['title', payload.title]);
    }
    if (payload.description) {
      tags.push(['description', payload.description]);
    }
    if (payload.picture) {
      tags.push(['picture', payload.picture]);
    }
    if (payload.source_code) {
      tags.push(['source_code', payload.source_code]);
    }
    if (payload.version) {
      tags.push(['version', payload.version]);
    }
    if (payload.published_at) {
      tags.push(['published_at', payload.published_at]);
    }
    return tags;
  }

  static isValidFilterOptNoscript() {
    return (event: Event) =>
      findTagFirstValue<string>(event.tags, this.noscriptTagLabel) ===
      this.customFilterOptLabelValue;
  }

  static createNoscript(
    wasmCode: ArrayBuffer,
    identifire: string,
    extraTags?: Tags,
  ) {
    const codeBase64 = this.arrayBufferToBase64(wasmCode);
    const tags = [[EventTags.D, identifire]];
    if (extraTags && extraTags.length > 0) {
      tags.push(...extraTags);
    }
    const rawEvent = new RawEvent('', this.kind, tags, codeBase64);
    return rawEvent;
  }

  static parseNoscriptNaddr(event: Event) {
    const d = findTagFirstValue<string>(event.tags, 'd');
    return `${event.kind}:${event.pubkey}:${d}`;
  }

  static parseNoscriptPayload(event: Event) {
    const title =
      findTagFirstValue<string>(event.tags, 'title') ||
      findTagFirstValue<string>(event.tags, 'd')!;
    const description = findTagFirstValue<string>(event.tags, 'description');
    const picture = findTagFirstValue<string>(event.tags, 'picture');
    const version = findTagFirstValue<string>(event.tags, 'version');
    const source_code = findTagFirstValue<string>(event.tags, 'source_code');
    const published_at = findTagFirstValue<number>(event.tags, 'published_at');

    const payload: NoscriptPayload = {
      title,
      description,
      picture,
      version,
      source_code,
      published_at,
    };
    return payload;
  }

  static parseNoscriptCode(event: Event) {
    const content = event.content;
    const code = this.base64ToArrayBuffer(content);
    return code;
  }

  static parseFilterOptPayload(event: Event) {
    const tags: Tags = event.tags;
    const filter: Filter = {};

    const ids = findTagValues(tags, 'ids');
    const authors = findTagValues(tags, 'authors');
    const kinds = findTagValues(tags, 'kinds');
    const since = findTagValues(tags, 'since');
    const until = findTagValues(tags, 'until');
    const limit = findTagValues(tags, 'limit');
    // note: below is correct, use #e/#d.., not e/d/a/t, because this tag is supposed to be assign value to filter
    const e = findTagValues(tags, '#e');
    const d = findTagValues(tags, '#d');
    const a = findTagValues(tags, '#a');
    const t = findTagValues(tags, '#t');

    if (ids) {
      filter.ids = ids;
    }
    if (authors) {
      filter.authors = authors;
    }
    if (kinds) {
      filter.kinds = kinds.map(k => +k);
    }
    if (since) {
      filter.since = +since[0];
    }
    if (limit) {
      filter.limit = +limit[0];
    }
    if (until) {
      filter.until = +until[0];
    }
    if (e) {
      filter['#e'] = e;
    }
    if (d) {
      filter['#d'] = d;
    }
    if (a) {
      filter['#a'] = a;
    }
    if (t) {
      filter['#t'] = t;
    }

    const parseMode = (event: Event) => {
      let modeTag = findTagFirstValue<number>(event.tags, 'mode');
      if (!modeTag) return undefined;

      modeTag = typeof modeTag === 'number' ? modeTag : +modeTag;
      if (modeTag == null) {
        return undefined;
      }

      return toFilterOptMode(modeTag);
    };

    const payload: FilterOptPayload = {
      filter,
      mode: parseMode(event) || FilterOptMode.custom,
    };
    return payload;
  }

  static createQueryNoscriptFilter(pubkeys: string[], limit = 50) {
    const filter: Filter = {
      kinds: [this.kind],
      limit,
    };
    if (pubkeys.length > 0) {
      filter.authors = pubkeys;
    }
    return filter;
  }

  static createQueryNoscriptFilterById(
    pubkeys: string[],
    identifier: string,
    limit = 50,
  ) {
    const filter: Filter = {
      '#d': [identifier],
      kinds: [this.kind],
      limit,
    };
    if (pubkeys.length > 0) {
      filter.authors = pubkeys;
    }
    return filter;
  }

  static arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; ++i) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; ++i) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function findTagFirstValue<T>(tags: Tags, firstLabel: string) {
  const tag = tags.find(t => t[0] === firstLabel);
  if (tag && tag.length > 1) {
    return tag[1] as T;
  }
  return undefined;
}

function findTag(tags: Tags, firstLabel: string) {
  return tags.find(t => t[0] === firstLabel);
}

function findTagValues(tags: Tags, firstLabel: string) {
  const values = findTag(tags, firstLabel);
  if (values && values.slice(1).length > 0) {
    return values.slice(1);
  }
  return null;
}

function toFilterOptMode(num: number): FilterOptMode | undefined {
  const enumKeys = Object.keys(FilterOptMode).filter(
    key => !isNaN(Number(FilterOptMode[key])),
  );

  for (const key of enumKeys) {
    if (FilterOptMode[key] === num) {
      return FilterOptMode[key];
    }
  }

  return undefined;
}
