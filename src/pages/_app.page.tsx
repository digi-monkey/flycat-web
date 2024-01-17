import '../window';
import 'styles/tailwind.css';
import 'styles/global.scss';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import { wrapper } from 'store/configureStore';
import { Provider } from 'react-redux';
import { Analytics } from '@vercel/analytics/react';
import { ConfigProvider } from 'antd';
import { appWithTranslation } from 'next-i18next';
import { ReactElement, ReactNode } from 'react';
import { initConfig } from '@joyid/nostr';
import { joyIdConfig } from 'core/joyid/config';

import Head from 'next/head';
import theme from 'constants/theme';

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactNode) => ReactElement;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const App = ({ Component, pageProps }: AppPropsWithLayout) => {
  const { store } = wrapper.useWrappedStore(pageProps);
  initConfig(joyIdConfig);
  return (
    <Provider store={store}>
      <ConfigProvider theme={theme}>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          />
          <meta name="description" content="a beautiful nostr client" />
          <meta
            name="keywords"
            content="nostr, nostr-protocol, social-network, bitcoin, lighting-network, decentralization"
          />
          {/* twitter */}
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="flycat" />
          <meta name="twitter:url" content="https://flycat.club" />
          <meta name="twitter:description" content="a beautiful nostr client" />
          <meta
            name="twitter:image"
            content="https://flycat.club/logo/app/512.svg"
          />
          <meta name="twitter:creator" content="@flycatclub" />

          {/* ogp */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content="flycat" />
          <meta property="og:description" content="a beautiful nostr client" />
          <meta property="og:site_name" content="flycat" />
          <meta property="og:url" content="https://flycat.club" />
          <meta
            property="og:image"
            content="https://flycat.club/logo/app/512.svg"
          />
        </Head>
        <Component {...pageProps} />
        <Analytics />
      </ConfigProvider>
    </Provider>
  );
};

export default appWithTranslation(App);
