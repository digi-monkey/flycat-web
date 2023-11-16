import { useState, useEffect } from 'react';
import { buildNote, urlToHTML } from './utils';
import { getUrlMetadata, UrlMetadata } from 'core/ogp';
import Script from 'next/script'


import styles from './index.module.scss';
import URLPreview from './URLPreview';
interface PreviewProps {
  url: string;
}

export function UrlPreview({ url }: PreviewProps) {
  const [data, setData] = useState<UrlMetadata>();
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getUrlMetadata(url);
        data.url = data.url || url;
        setData(data);
      } catch (error) {
        console.error(error);
      }
    }
    
    async function parseURL() {
      const result = await urlToHTML({ url });

      if (result && result.length > 0) {
        setHtml(result);
        setTimeout(() => buildNote(url), 1000);
      } else fetchData();
    }

    parseURL();
  }, [url]);

  if (!data && !html) return <div style={{ textAlign: 'center' }}>Loading...</div>;

  return (
    <div className={styles.urlPreview}>
       <Script src="https://platform.twitter.com/widgets.js" />
       <Script src="https://www.tiktok.com/embed.js" />
      { html.length ? <div className={styles.iframe} dangerouslySetInnerHTML={{ __html: html }}></div> : <URLPreview {...data} /> }
    </div>
  )
}
