import CryptoJS from 'crypto-js';
import AES from 'crypto-js/aes';
import { Base64Str, HexStr, Utf8Str } from '../types';
import { JSEncrypt } from 'jsencrypt';
import * as secp256k1 from '@noble/secp256k1';
import { utils as secpUtils, schnorr } from '@noble/secp256k1';
import { Buffer } from 'buffer';

import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
secp256k1.utils.hmacSha256Sync = (key, ...msgs) =>
  hmac(sha256, key, secp256k1.utils.concatBytes(...msgs));
secp256k1.utils.sha256Sync = (...msgs) =>
  sha256(secp256k1.utils.concatBytes(...msgs));

const { bech32 } = require('bech32');

const MODE = CryptoJS.mode.CBC;
const PADDING = CryptoJS.pad.Pkcs7;
const DECRYPT_ENCODING = CryptoJS.enc.Utf8;
const ENCRYPT_ENCODING = CryptoJS.enc.Base64;
const HASH_ENCODING = CryptoJS.enc.Hex;
const HEX_ENCODING = CryptoJS.enc.Hex;

export function Sha256(data: string): HexStr {
  return CryptoJS.SHA256(data).toString(HASH_ENCODING);
}

export async function schnorrSign(
  eventId: HexStr,
  key: HexStr,
): Promise<HexStr> {
  const sigBytes = await schnorr.sign(eventId, key);
  return secpUtils.bytesToHex(sigBytes);
}

export async function schnorrVerify(msg: string, pubkey: string, sig: string) {
  return await schnorr.verify(sig, msg, pubkey);
}

export function matchKeyPair(pubKey: string, privKey: string): boolean {
  const expectPubKey = secpUtils.bytesToHex(schnorr.getPublicKey(privKey));
  return expectPubKey === pubKey;
}

export function bech32Encode(data: HexStr, prefix: Utf8Str): string {
  try {
    // let buffer = this.fromHexString(key)
    let words = bech32.toWords(fromHexString(data));
    return bech32.encode(prefix, words);
  } catch (error: any) {
    throw new Error(`bech32Encode error ${error.message}`);
  }
}

export function bech32Decode(data: string) {
  try {
    let { prefix, words } = bech32.decode(data);
    let buffer = Buffer.from(bech32.fromWords(words));
    return { decoded: toHexString(buffer), prefix };
  } catch (error: any) {
    throw new Error(`bech32Decode error ${error.message}`);
  }
}

export function toHexString(buffer: Uint8Array) {
  let hexString = buffer.reduce((s, byte) => {
    let hex = byte.toString(16);
    if (hex.length === 1) hex = '0' + hex;
    return s + hex;
  }, '');
  // hexString = JSON.stringify(JSON.parse(hexString))
  return hexString;
}

export function fromHexString(str: string) {
  if (str.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(str)) {
    return null;
  }
  let buffer = new Uint8Array(str.length / 2);
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = parseInt(str.substr(2 * i, 2), 16);
  }
  return buffer;
}

export function decrypt(
  encryptData: Base64Str,
  _key: HexStr,
  _iv: HexStr,
): Utf8Str | null {
  console.log(_key, _iv);
  try {
    const iv = CryptoJS.enc.Hex.parse(_iv.replace('0x', ''));
    const key = CryptoJS.enc.Hex.parse(_key.replace('0x', ''));
    const decodedData = AES.decrypt(encryptData, key, {
      iv,
      mode: MODE,
      padding: PADDING,
    });
    return decodedData.toString(DECRYPT_ENCODING);
  } catch (error) {
    console.error('decrypt error', error);
    return null;
  }
}

export function encrypt(
  message: Utf8Str,
  _key: HexStr,
  _iv: HexStr,
): Base64Str {
  const iv = CryptoJS.enc.Hex.parse(_iv.replace('0x', ''));
  const key = CryptoJS.enc.Hex.parse(_key.replace('0x', ''));
  const encodedData = AES.encrypt(message, key, {
    iv,
    mode: MODE,
    padding: PADDING,
  });
  return encodedData.ciphertext.toString(ENCRYPT_ENCODING);
}

export function hash(message: Base64Str) {
  return '0x' + CryptoJS.SHA1(message).toString(HASH_ENCODING);
}

export function generateRandomAesKey() {
  return generateRandomBytes(16).slice(2);
}

export function generateRandomIv() {
  return generateRandomBytes(8).slice(2);
}

export function generateRandomBytes(length: number) {
  return '0x' + CryptoJS.lib.WordArray.random(length).toString(HEX_ENCODING);
}

export function generateRandomRsaKeys() {
  const key = new JSEncrypt();
  const info = key.getKey();
  return {
    privateKey: info.getPrivateBaseKeyB64(),
    publicKey: info.getPublicBaseKeyB64(),
  };
}

export function getPublicKeyFromPrivateKey(privateKey: Base64Str): Base64Str {
  const key = new JSEncrypt();
  key.setPrivateKey(privateKey);
  return key.getPublicKeyB64();
}

// aes key and iv
export function encryptTextToPk(encryptionPublicKey: string, text: Utf8Str) {
  console.info(`pk: ${encryptionPublicKey}, text: ${text}`);
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(encryptionPublicKey);
  const encrypted = encrypt.encrypt(text);
  if (encrypted === false || encrypted == null)
    throw new Error('encrypt failed..');
  return encrypted;
}

export function decryptWithPrivateKey(
  encryptedText: string,
  privateKey: HexStr,
) {
  console.info(
    `[decryptWithPrivateKey] encryptedText: ${encryptedText}, privateKey: ${privateKey}`,
  );
  const decrypt = new JSEncrypt();
  decrypt.setPrivateKey(privateKey);
  const decrypted = decrypt.decrypt(encryptedText);
  if (decrypted === false || decrypted == null)
    throw new Error('decrypt failed..');
  return decrypted;
}
