import '../window';
import "styles/global.scss";
import Head from 'next/head';
import theme from 'constants/theme';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import { wrapper } from 'store/configureStore';
import { ThemeProvider } from '@mui/material/styles';
import { appWithTranslation } from 'next-i18next';
import { ReactElement, ReactNode } from 'react';

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactNode) => ReactElement;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const App = ({ Component, pageProps }: AppPropsWithLayout) => {
  return (
    <ThemeProvider theme={theme}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </Head>
      <Component {...pageProps} />
    </ThemeProvider>
  );
};

export default wrapper.withRedux(appWithTranslation(App));