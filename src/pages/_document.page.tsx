import Document, { Html, Head, Main, NextScript } from 'next/document';


export default class FlyCatDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <script async src="https://platform.twitter.com/widgets.js"></script>
          <script async src="https://www.tiktok.com/embed.js"></script>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
