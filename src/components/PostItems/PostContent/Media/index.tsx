import { normalizeContent } from 'service/helper';
import { UrlPreview } from 'components/URLPreview';
import { LightingInvoice, LnUrlInvoice } from './LightingInvoice';
import { AudioPreview } from './AudioPreview';
import { ImagePreview } from './ImagePreview';
import { VideoPreview } from './VideoPreview';

import classname from 'classnames';
import styles from './index.module.scss';

export interface PreviewsProp {
  content: string;
}

export function MediaPreviews({ content }: PreviewsProp) {
  const {
    lnUrls,
    bolt11Invoices,
    previewUrls,
    imageUrls,
    videoUrls,
    audioUrls,
  } = normalizeContent(content);

  return (
    <>
      {imageUrls.length > 0 && (
        <ul
          className={classname(styles.gallery, {
            [styles.w100]: imageUrls.length === 1,
            [styles.w50]: [2, 4, 8].includes(imageUrls.length),
            [styles.w33]: ![1, 2, 4, 8].includes(imageUrls.length),
          })}
        >
          {imageUrls.map(url => (
            <ImagePreview url={url} key={url} />
          ))}
        </ul>
      )}
      {videoUrls.length > 0 && (
        <div>
          {videoUrls.map(url => (
            <VideoPreview url={url} key={url} />
          ))}
        </div>
      )}
      {audioUrls.length > 0 && (
        <div>
          {audioUrls.map(url => (
            <AudioPreview src={url} key={url} />
          ))}
        </div>
      )}
      {previewUrls.length > 0 && (
        <div>
          {previewUrls.map(url => (
            <UrlPreview url={url} key={url} />
          ))}
        </div>
      )}
      {bolt11Invoices.length > 0 && (
        <div>
          {bolt11Invoices.map(url => (
            <LightingInvoice url={url} key={url} />
          ))}
        </div>
      )}
      {lnUrls.length > 0 && (
        <div>
          {lnUrls.map(url => (
            <LnUrlInvoice url={url} key={url} />
          ))}
        </div>
      )}
    </>
  );
}
