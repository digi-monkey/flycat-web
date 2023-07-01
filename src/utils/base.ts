import { Utf8Str } from "types";
import { Buffer } from 'buffer';

export function u32ToLEBuffer(u32: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(u32);
  return buf;
}

export function LEBufferToU32(buf: Buffer): number {
  const value = buf.readUInt32LE();
  return value;
}

export function utf8StrToBuffer(msg: Utf8Str): Buffer {
  const encoder = new TextEncoder();
  const uint8array = encoder.encode(msg);
  return Buffer.from(uint8array);
}

export function bufferToUtf8Str(buf: Buffer) {
  const decoder = new TextDecoder();
  const string = decoder.decode(buf);
  return string;
}
