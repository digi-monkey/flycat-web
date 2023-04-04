import '../window';
import "styles/global.scss";
import 'sweetalert2/src/sweetalert2.scss';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import { wrapper } from 'store/configureStore';
import { ThemeProvider } from '@mui/material/styles';
import { appWithTranslation } from 'next-i18next';
import { ReactElement, ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';

import Head from 'next/head';
import theme from 'constants/theme';


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
      <Analytics />
    </ThemeProvider>
  );
};

export default wrapper.withRedux(appWithTranslation(App));
