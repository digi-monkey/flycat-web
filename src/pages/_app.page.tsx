import '../window';
import "styles/global.scss";
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import { wrapper } from 'store/configureStore';
import { Provider } from 'react-redux';
import { Analytics } from '@vercel/analytics/react';
import { ConfigProvider } from 'antd';
import { appWithTranslation } from 'next-i18next';
import { ReactElement, ReactNode } from 'react';
import { initConfig } from '@joyid/nostr';

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
  initConfig({
    // your app name
    name: 'flycat',
    // your app logo,
    logo: 'https://flycat.club/logo512.png',
    // optional, default to 'https://poc.joyid.dev'
    joyidAppURL: 'https://poc.joyid.dev',
  }); 
  return (
    <Provider store={store}>
      <ConfigProvider theme={theme}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </Head>
        <Component {...pageProps} />
        <Analytics />
      </ConfigProvider>
    </Provider>
  );
};

export default appWithTranslation(App);
