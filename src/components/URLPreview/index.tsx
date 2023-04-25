import { useState, useEffect } from 'react';
import { buildNote, urlToHTML } from './utils';
import { getUrlMetadata, UrlMetadata } from 'service/ogp';

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
        setData(await getUrlMetadata(url));
      } catch (error) {
        console.error(error);
      }
    }
    
    async function parseURL() {
      const result = await urlToHTML({ url });

      if (result.length > 0) {
        setHtml(result);
        buildNote();
      } else fetchData();
    }

    parseURL();
  }, [url]);

  if (!data && !html) return <div style={{ textAlign: 'center' }}>Loading...</div>;

  return (
    <div className={styles.urlPreview}>
      { html.length ? <div className={styles.iframe} dangerouslySetInnerHTML={{ __html: html }}></div> : <URLPreview {...data} /> }
    </div>
  )
}
