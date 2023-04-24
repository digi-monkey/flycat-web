import { matchSocialMedia } from 'utils/common';
import { useState, useEffect } from 'react';
import { getUrlMetadata, UrlMetadata } from 'service/ogp';

import Link from 'next/link';
import styles from './index.module.scss';
interface PreviewProps {
  url: string;
}

export function UrlPreview({ url }: PreviewProps) {
  const mediaType = matchSocialMedia(url);
  const [data, setData] = useState<UrlMetadata>();

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getUrlMetadata(url);
        setData(result);
      } catch (error) {
        console.error(error);
      }
    }

    fetchData();
  }, [url]);

  if (!data) {
    return <div style={{ textAlign: 'center' }}>Loading...</div>;
  }

  return <div className={styles.urlPreview}>
      { mediaType ?
          (
            <div className={styles.iframe} title={mediaType}>
              <iframe src={url} allowFullScreen frameBorder={0} sandbox="allow-same-origin"></iframe>
            </div>
          ) : (
            <div className={styles.preview}>
              {data.image && (
                <span style={{ width: '100px', height: '100px', marginRight: '10px' }}>
                  <img
                    src={data.image}
                    alt={data.title}
                    style={{ maxWidth: '100px', maxHeight: '100%' }}
                  />
                </span>
              )}
              <div>
                {data.title && (
                  <span style={{ fontSize: '16px', marginBottom: '5px', display: 'block' }}>{data.title}</span>
                )}
                <Link href={data.url || url}>{data.url || url}</Link>
                {data.description && <p style={{ fontSize: '12px', color: 'gray' }}>{data.description}</p>}
              </div>
            </div>
          )
      }
    </div>
}
