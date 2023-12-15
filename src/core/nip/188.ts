// this nip is not proposed yet
// it is foucs on nostr scripts(wasm bytecode)
import { Event } from 'core/nostr/Event';
import { RawEvent } from 'core/nostr/RawEvent';
import { EventTags, Filter, Tags } from 'core/nostr/type';

export class Nip188 {
  static kind = 32042; // nostr script kind
  static noscriptTagLabel = 'noscript';
  static customMsgFilterLabelValue = 'wasm:msg:filter';

  static createNoscriptMsgFilterTag(filter: Filter, description?: string) {
    const tags: Tags = [];
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

    if (description) {
      tags.push(['description', description]);
    }

    tags.push([this.noscriptTagLabel, this.customMsgFilterLabelValue]);

    return tags;
  }

  static isValidCustomMsgFilterNoscript() {
    return (event: Event) =>
      !!event.tags.find(
        t =>
          t[0] === this.noscriptTagLabel &&
          t[1] === this.customMsgFilterLabelValue,
      );
  }

  static createNoscript(
    wasmCode: ArrayBuffer,
    identifire: string,
    extraTags?: Tags,
  ) {
    const codeBase64 = this.arrayBufferToBase64(wasmCode);
    const tags = [[EventTags.D, identifire]];
    console.log('check:', extraTags, extraTags && extraTags.length > 0);
    if (extraTags && extraTags.length > 0) {
      tags.push(...extraTags);
    }
    const rawEvent = new RawEvent('', this.kind, tags, codeBase64);
    return rawEvent;
  }

  static parseNoscript(event: Event) {
    const content = event.content;
    const code = this.base64ToArrayBuffer(content);
    return code;
  }

  static parseNoscriptMsgFilterTag(event: Event) {
    const tags: Tags = event.tags;
    const filter: Filter = {};
    const ids = findTagValues(tags, 'ids');
    const authors = findTagValues(tags, 'authors');
    const kinds = findTagValues(tags, 'kinds');
    const since = findTagValues(tags, 'since');
    const until = findTagValues(tags, 'until');
    const limit = findTagValues(tags, 'limit');
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
    return filter;
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
