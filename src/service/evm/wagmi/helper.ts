import { wagmiClient } from './client';
import { disconnect } from '@wagmi/core'

export function isWalletConnected() {
  return wagmiClient.status === 'connected';
}

export function isWalletDisconnected() {
  return wagmiClient.status === 'disconnected';
}

export async function disconnectWagmi(){
	await disconnect();
	wagmiClient.clearState();
	wagmiClient.destroy();
}
