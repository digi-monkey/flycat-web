import * as secp256k1 from '@noble/secp256k1';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { JsonRpcSigner } from '@ethersproject/providers';

export function getCaip10(chainId: number, address: string) {
  const caip10 = `eip155:${chainId}:${address}`;
  return caip10;
}

export function getMessage(username: string, caip10: string) {
  return `Log into Nostr client as '${username}'\n\nIMPORTANT: Please verify the integrity and authenticity of connected Nostr client before signing this message\n\nSIGNED BY: ${caip10}`;
}

export async function getSignature(message: string, signer: JsonRpcSigner) {
  const signature = await signer.signMessage(message);
  return signature;
}

/**
 *
 * @param username NIP-02/NIP-05 identifier
 * @param caip10 CAIP identifier for the blockchain account
 * @param sig Deterministic signature from X-wallet provider
 * @param password Optional password
 * @returns Deterministic private key as hex string
 */
export async function privateKeyFromX(
  username: string,
  caip10: string,
  sig: string,
  password?: string,
): Promise<string> {
  if (sig.length < 64) throw new Error('Signature too short');
  const inputKey = await sha256(
    secp256k1.utils.hexToBytes(
      sig.toLowerCase().startsWith('0x') ? sig.slice(2) : sig,
    ),
  );
  const info = `${caip10}:${username}`;
  const salt = await sha256(
    `${info}:${password ? password : ''}:${sig.slice(-64)}`,
  );
  const hashKey = await hkdf(sha256, inputKey, salt, info, 42);
  return secp256k1.utils.bytesToHex(secp256k1.utils.hashToPrivateKey(hashKey));
}
