import { ethers } from 'ethers';

export async function connectToMetaMask() {
  // Check if MetaMask is installed
  if (typeof window.ethereum === 'undefined') {
    console.error('Please install MetaMask to use this dApp.');
		return null;
  }

  // Request access to the user's MetaMask account
  await window.ethereum.request({ method: 'eth_requestAccounts' });

  // Create an ethers.js provider using MetaMask
  const provider = new ethers.providers.Web3Provider(window.ethereum);

  // Get the user's selected address from MetaMask
  const signer = provider.getSigner();
  const address = await signer.getAddress();
	const chainId = await signer.getChainId();

  console.log('Connected to MetaMask with address:', address);
	return {signer, address, chainId};
}
