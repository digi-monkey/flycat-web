import { UrlMetadata } from 'core/ogp';
import { getBaseUrl, maxStrings } from 'utils/common';

import styles from './index.module.scss';

const URLPreview = ({ image, title, url, description }: UrlMetadata) => {
  return (
    <div
      className={styles.preview}
      onClick={() => {
        window.open(url, "_blank");
      }}
    >
      <div>
        {<div className={styles.baseUrl}>{getBaseUrl(url!)}</div>}
        {title && (
          <div className={styles.siteTitle}>{maxStrings(title, 45)}</div>
        )}
        {description && (
          <div className={styles.siteDescription}>
            {maxStrings(description, 100)}
          </div>
        )}
      </div>
      {image && (
        <div className={styles.cover}>
          <img src={image} alt={title} />
        </div>
      )}
    </div>
  );
};

export default URLPreview;
