import { Event } from 'core/nostr/Event';
import { RawEvent } from 'core/nostr/RawEvent';
import { getCaip10, getMessage, privateKeyFromX } from '../nip/111';
import { getPublicKey } from 'core/crypto';
import { loadTempMyPublicKey } from 'store/util';

export async function getPrivateKeyFromWalletConnectSignIn(
  username: string,
  password?: string,
) {
  const { isWalletDisconnected } = await import('./wagmi/helper');
  if (await isWalletDisconnected()) {
    alert(
      'your wallet is disconnected, in order to use it, you need to sign out and sign in again with WalletConnect!',
    );
    throw new Error('wallectConnect signer not found');
  }

  const { fetchSigner } = await import('@wagmi/core');
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
  const { isWalletDisconnected } = await import('./wagmi/helper');
  if (await isWalletDisconnected()) {
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

export async function getNostrAccountInfoFromWalletConnectSignIn(
  username: string,
  password?: string,
) {
  const { isWalletDisconnected } = await import('./wagmi/helper');
  if (await isWalletDisconnected()) {
    alert(
      'your wallet is disconnected, in order to use it, you need to sign out and sign in again with WalletConnect!',
    );
    throw new Error('wallectConnect signer not found');
  }

  const { fetchSigner } = await import('@wagmi/core');
  const signer = await fetchSigner();
  if (signer == null) throw new Error('wallectConnect signer not found');

  const chainId: number = await signer.getChainId();
  const address = await signer.getAddress();
  const caip10 = getCaip10(chainId, address);
  const message = getMessage(username, caip10);

  const sig: string = await signer.signMessage(message)!;
  const privKey = await privateKeyFromX(username, caip10, sig, password);
  const pubkey = getPublicKey(privKey);
  return {
    privKey,
    pubkey,
    chainId,
    address,
  };
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
  chainId?: number,
  address?: string,
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
    const info = await getNostrAccountInfoFromWalletConnectSignIn(
      username,
      password,
    );
    if (info == null) {
      const errMsg = "get private key failed, can't sign event";
      alert(errMsg);
      throw new Error(errMsg);
    }
    if (chainId && info.chainId !== chainId) {
      const errMsg =
        "chainId not matched! did you change your wallect-connect's network?";
      alert(errMsg);
      throw new Error(errMsg);
    }
    if (address && info.address !== address) {
      const errMsg =
        "eth address not matched! did you select different wallect-connect's account?";
      alert(errMsg);
      throw new Error(errMsg);
    }
    const pk = loadTempMyPublicKey();
    if (pk && pk != info.pubkey) {
      const errMsg =
        'nostr pubkey not matched! you are trying with account different with what we remember last time, please make sure you input the exact same info and try logout and then login.';
      alert(errMsg);
      throw new Error(errMsg);
    }
    const privKey = info.privKey;
    return await raw.toEvent(privKey);
  };
}
