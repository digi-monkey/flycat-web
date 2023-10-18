// this nip is not proposed yet
// it is foucs on nostr scripts(wasm bytecode)
import { Event } from "core/nostr/Event";
import { RawEvent } from "core/nostr/RawEvent";
import { EventTags, Filter } from "core/nostr/type";

export class Nip188 {
  static kind = 32042; // nostr script kind

  static createNoscript(wasmCode: ArrayBuffer, identifire: string) {
    const codeBase64 = this.arrayBufferToBase64(wasmCode);
    const tags = [[
      EventTags.D, identifire
    ]]
    const rawEvent = new RawEvent('', this.kind, tags, codeBase64);
    return rawEvent;
  }

  static parseNoscript(event: Event) {
    const content = event.content;
    const code = this.base64ToArrayBuffer(content);
    return code;
  }

  static createQueryNoscriptFilter(pubkeys: string[], identifire: string, limit = 50) {
    const filter: Filter = {
      "#d": [identifire],
      limit
    }
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
