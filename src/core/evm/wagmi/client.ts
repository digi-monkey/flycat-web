import { publicProvider } from '@wagmi/core/providers/public';
import { createClient, configureChains, mainnet } from '@wagmi/core';
import { infuraProvider } from '@wagmi/core/providers/infura';

const { chains, provider } = configureChains(
  [mainnet],
  [
    publicProvider(),
    infuraProvider({ apiKey: process.env.NEXT_PUBLIC_INFURA_KEY! }),
  ],
);

export const wagmiClient = createClient({
  autoConnect: false,
  provider,
});
