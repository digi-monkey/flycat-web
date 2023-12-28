import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from 'next/document';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';

class FlyCatDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta name="application-name" content="flycat" />
          <meta name="format-detection" content="telephone=no" />
          {/* apple pwa */}
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-title" content="flycat" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="default"
          />

          {/* windows */}
          <meta name="msapplication-TileColor" content="#2B5797" />
          <meta name="msapplication-tap-highlight" content="no" />

          <link rel="manifest" href="/manifest.json" />

          {/* fonts */}
          <link
            href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Noto%20Sans:wght@100;200;300;400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          />

          {/* icons */}
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="icon" type="image/png" sizes="32x32" href="/logo192.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/logo192.png" />

          {/* apple icons */}
          <link rel="apple-touch-icon" href="/logo512.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/logo192.png" />
          <link rel="apple-touch-icon" sizes="167x167" href="/logo192.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/logo192.png" />
          <link rel="mask-icon" href="/logo512.png" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

// ref: https://ant.design/docs/react/use-with-next-cn#%E4%BD%BF%E7%94%A8-pages-router

FlyCatDocument.getInitialProps = async (ctx: DocumentContext) => {
  const cache = createCache();
  const originalRenderPage = ctx.renderPage;
  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: App => props => (
        <StyleProvider cache={cache}>
          <App {...props} />
        </StyleProvider>
      ),
    });

  const initialProps = await Document.getInitialProps(ctx);
  const style = extractStyle(cache, true);
  return {
    ...initialProps,
    styles: (
      <>
        {initialProps.styles}
        <style dangerouslySetInnerHTML={{ __html: style }} />
      </>
    ),
  };
};

export default FlyCatDocument;
