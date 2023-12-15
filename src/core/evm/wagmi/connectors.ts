import { WalletConnectConnector } from '@wagmi/core/connectors/walletConnect';
import {
  arbitrum,
  avalanche,
  bsc,
  fantom,
  gnosis,
  mainnet,
  optimism,
  polygon,
} from '@wagmi/chains';

// Get projectID at https://cloud.walletconnect.com
if (!process.env.NEXT_PUBLIC_PROJECT_ID) {
  throw new Error('You need to provide NEXT_PUBLIC_PROJECT_ID env variable');
}
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

const supportedChains = [
  arbitrum,
  avalanche,
  bsc,
  fantom,
  gnosis,
  mainnet,
  optimism,
  polygon,
];

export const walletConnector = new WalletConnectConnector({
  chains: supportedChains,
  options: {
    projectId,
    showQrModal: true,
    metadata: {
      name: 'Flycat',
      description: 'Nostr web client',
      url: 'https://flycat.club',
      icons: ['https://flycat.club/logo512.png'],
    },
  },
});
