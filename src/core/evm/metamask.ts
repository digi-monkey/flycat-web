import { Event } from 'core/nostr/Event';
import { RawEvent } from 'core/nostr/RawEvent';
import {
  getCaip10,
  getMessage,
  getSignature,
  privateKeyFromX,
} from '../nip/111';
import { getPublicKey } from 'core/crypto';
import { loadTempMyPublicKey } from 'store/util';

export async function connectToMetaMask() {
  const { Web3Provider } = await import('@ethersproject/providers');

  // Check if MetaMask is installed
  if (typeof window.ethereum === 'undefined') {
    console.error('Please install MetaMask to use this dApp.');
    return null;
  }

  // Request access to the user's MetaMask account
  await window.ethereum.request({ method: 'eth_requestAccounts' });

  // Create an ethers.js provider using MetaMask
  const provider = new Web3Provider(window.ethereum);

  // Get the user's selected address from MetaMask
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  const chainId = await signer.getChainId();

  console.log('Connected to MetaMask with address:', address);
  return { signer, address, chainId };
}

export async function getNostrAccountInfoFromMetamaskSignIn(
  username: string,
  password?: string,
) {
  const walletExt = await connectToMetaMask();
  if (walletExt == null) {
    alert('metamask not installed');
    return null;
  }
  const caip10 = getCaip10(walletExt.chainId, walletExt.address);
  const message = getMessage(username, caip10);
  const sig = await getSignature(message, walletExt.signer);
  const privKey = await privateKeyFromX(username, caip10, sig, password);
  const pubkey = getPublicKey(privKey);
  return {
    pubkey,
    privKey,
    chainId: walletExt.chainId,
    address: walletExt.address,
  };
}

export async function getPrivateKeyFromMetamaskSignIn(
  username: string,
  password?: string,
) {
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

    return await getPublicKeyFromMetamaskSignIn(username, password);
  };
}

export function createMetamaskSignEvent(
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
    const info = await getNostrAccountInfoFromMetamaskSignIn(
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
        "chainId not matched! did you change your metamask's network?";
      alert(errMsg);
      throw new Error(errMsg);
    }
    if (address && info.address !== address) {
      const errMsg =
        "eth address not matched! did you select different metamask's account?";
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
