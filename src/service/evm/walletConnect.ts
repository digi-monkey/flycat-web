import { Event } from 'service/nostr/Event';
import { RawEvent } from 'service/nostr/RawEvent';
import { fetchSigner } from '@wagmi/core';
import { getCaip10, getMessage, privateKeyFromX } from '../nip/111';
import { getPublicKey } from 'service/crypto';
import { isWalletDisconnected } from './wagmi/helper';

export async function getPrivateKeyFromWalletConnectSignIn(
  username: string,
  password?: string,
) {
  if (isWalletDisconnected()) {
    alert(
      'your wallet is disconnected, in order to use it, you need to sign out and sign in again with WalletConnect!',
    );
    throw new Error('wallectConnect signer not found');
  }

  const signer = await fetchSigner();
  if (signer == null) throw new Error('wallectConnect signer not found');

  const chainId: number = await signer.getChainId();
  const address = await signer.getAddress();
  const caip10 = getCaip10(chainId, address);
  const message = getMessage(username, caip10);

  const sig: string = await signer.signMessage(message)!;
  const privKey = await privateKeyFromX(username, caip10, sig, password);
  return privKey;
}

export async function getPublicKeyFromWalletConnectSignIn(
  username: string,
  password?: string,
) {
  if (isWalletDisconnected()) {
    alert(
      'you need to sign out and sign in with WalletConnect again in order to use it!',
    );
    throw new Error('wallectConnect signer not found');
  }

  const privKey = await getPrivateKeyFromWalletConnectSignIn(
    username,
    password,
  );
  if (privKey == null) {
    alert('error during generate privkey');
    throw new Error('error during generate privKey');
  }
  return getPublicKey(privKey);
}

export function createWalletConnectGetPublicKey(username?: string) {
  return async () => {
    if (username == null) {
      // todo: how do we use custom ux instead of window.prompt to get user input here?
      username =
        window.prompt('Your Evm sign-in username: ', 'nostr') || undefined;
      if (username == null) {
        const errMsg =
          "Evm sign-in username not found, can't generate public key";
        alert(errMsg);
        throw new Error(errMsg);
      }
    }

    const password = window.prompt('Your Evm sign-in password: ') || undefined;

    return await getPublicKeyFromWalletConnectSignIn(username, password);
  };
}

export function createWalletConnectSignEvent(
  username?: string,
): (raw: RawEvent) => Promise<Event> {
  return async (raw: RawEvent) => {
    if (username == null) {
      // todo: how do we use custom ux instead of window.prompt to get user input here?
      username =
        window.prompt('Your Evm sign-in username: ', 'nostr') || undefined;
      if (username == null) {
        const errMsg = "Evm sign-in username not found, can't sign event";
        alert(errMsg);
        throw new Error(errMsg);
      }
    }

    const password = window.prompt('Your Evm sign-in password: ') || undefined;
    const privKey = await getPrivateKeyFromWalletConnectSignIn(
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
