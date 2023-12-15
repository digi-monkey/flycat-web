import { UrlMetadata, getUrlMetadata } from 'core/ogp';
import { getBaseUrl, maxStrings } from 'utils/common';
import { useEffect, useMemo, useState } from 'react';

import styles from '../index.module.scss';

export const URLPreview = ({ url }: { url: string }) => {
  const [data, setData] = useState<UrlMetadata>();

  async function fetchData() {
    try {
      const data = await getUrlMetadata(url);
      data.url = data.url || url;
      setData(data);
    } catch (error) {
      console.error(error);
    }
  }
  useEffect(() => {
    fetchData();
  }, []);

  const describedUrl = useMemo(() => {
    try {
      let result: string | undefined;
      if (data?.title && data?.description) {
        result = `${data.title}(${data.description.slice(0, 45)}..)`;
        return result;
      }
      if (data?.title) {
        return `${data.title}(${new URL(url).hostname})`;
      }
      if (data?.description) {
        return `${new URL(url).hostname}(${data.description.slice(0, 45)}..)`;
      }
      return url;
    } catch (error: any) {
      console.debug('build describeUrl failed, ', error.message);
      return url;
    }
  }, [data]);

  return (
    <span>
      <a
        href={url}
        target="_blank"
        className={styles.hoverLink}
        onClick={e => e.stopPropagation()}
      >
        {describedUrl}
      </a>
      <div
        className={styles.preview}
        onClick={e => {
          e.stopPropagation();
          window.open(url, '_blank');
        }}
      >
        <div>
          {<div className={styles.baseUrl}>{getBaseUrl(url)}</div>}
          {data?.title && (
            <div className={styles.siteTitle}>{maxStrings(data.title, 45)}</div>
          )}
          {data?.description && (
            <div className={styles.siteDescription}>
              {maxStrings(data.description, 100)}
            </div>
          )}
        </div>
        {data?.image && (
          <div className={styles.cover}>
            <img src={data.image} alt={data.title} />
          </div>
        )}
      </div>
    </span>
  );
};
