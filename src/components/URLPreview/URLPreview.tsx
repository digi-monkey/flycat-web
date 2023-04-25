import { UrlMetadata } from 'service/ogp';

import Link from 'next/link';
import styles from './index.module.scss';

const URLPreview = ({ image, title, url, description }: UrlMetadata) => {
  return <div className={styles.preview}>
    {image && (
      <div style={{ width: '100px', height: '100px', marginRight: '10px' }}>
        <img src={image} alt={title} style={{ maxWidth: '100px', maxHeight: '100%' }} />
      </div>
    )}
    <div>
      {title && ( <span style={{ fontSize: '16px', marginBottom: '5px', display: 'block' }}>{title}</span> )}
      {url && <Link href={url}>{url}</Link>}
      {description && <p style={{ fontSize: '12px', color: 'gray' }}>{description}</p>}
    </div>
  </div>
}

export default URLPreview;
