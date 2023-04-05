import { RawEvent, Event } from "service/api";
import { connectToMetaMask } from "service/metamask";
import { getCaip10, getMessage, getSignature, privateKeyFromX } from "../nip/111";
import { getPublicKey } from "service/crypto";

export async function getPrivateKeyFromMetamaskSignIn(username: string, password?: string) {
  const walletExt = await connectToMetaMask();
  if (walletExt == null) {
    alert('metamask not installed');
    return null;
  }
  const caip10 = getCaip10(walletExt.chainId, walletExt.address);
  const message = getMessage(username, caip10);
  const sig = await getSignature(message, walletExt.signer);
  const privKey = await privateKeyFromX(username, caip10, sig, password);
  return privKey;
}

export async function getPublicKeyFromMetamaskSignIn(
  username: string,
  password?: string,
) {
  const privKey = await getPrivateKeyFromMetamaskSignIn(username, password);
  if (privKey == null) {
    alert('error during generate privkey');
    throw new Error('error during generate privKey');
  }
  return getPublicKey(privKey);
}

export function createMetamaskGetPublicKey(username?: string) {
  return async () => {
    if (username == null) {
      // todo: how do we use custom ux instead of window.prompt to get user input here?
      username = window.prompt("Your Evm sign-in username: ", "nostr") || undefined;
      if(username == null){
        const errMsg = "Evm sign-in username not found, can't generate public key";
        alert(errMsg);
        throw new Error(errMsg);
      }
    }

    const password = window.prompt("Your Evm sign-in password: ") || undefined;

    return await getPublicKeyFromMetamaskSignIn(
      username,
      password,
    );
  };
}

export function createMetamaskSignEvent(username?: string): (
  raw: RawEvent,
) => Promise<Event> {
  return async (raw: RawEvent) => {
    if (username == null) {
      // todo: how do we use custom ux instead of window.prompt to get user input here?
      username = window.prompt("Your Evm sign-in username: ", "nostr") || undefined;
      if(username == null){
        const errMsg = "Evm sign-in username not found, can't sign event";
        alert(errMsg);
        throw new Error(errMsg);
      }
    }

    const password = window.prompt("Your Evm sign-in password: ") || undefined;
    const privKey = await getPrivateKeyFromMetamaskSignIn(
      username,
      password,
    );
    if (privKey == null) {
      const errMsg = "generate private key failed, can't sign event";
      alert(errMsg);
      throw new Error(errMsg);
    }
    return await raw.toEvent(privKey);
  };
}
