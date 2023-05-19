import Document, { Html, Head, Main, NextScript } from 'next/document';


export default class FlyCatDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Noto%20Sans:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
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
