export async function isWalletConnected() {
  const { wagmiClient } = await import('./client');
  return wagmiClient.status === 'connected';
}

export async function isWalletDisconnected() {
  const { wagmiClient } = await import('./client');
  return wagmiClient.status === 'disconnected';
}

export async function disconnectWagmi() {
  const { wagmiClient } = await import('./client');
  const { disconnect } = await import('@wagmi/core');
  await disconnect();
  wagmiClient.clearState();
  wagmiClient.destroy();
}
