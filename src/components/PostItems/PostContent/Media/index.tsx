import { normalizeContent } from 'core/nostr/content';
import { HyperLink } from 'components/PostItems/PostContent/Link';
import { LightingInvoice, LnUrlInvoice } from './LightingInvoice';
import { AudioPreview } from './AudioPreview';
import { ImagePreview } from './ImagePreview';
import { VideoPreview } from './VideoPreview';

import classname from 'classnames';
import styles from './index.module.scss';

export interface PreviewsProp {
  content: string;
  isNsfw?: boolean;
}

export function MediaPreviews({ content, isNsfw }: PreviewsProp) {
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
            [styles.blur]: isNsfw === true
          })}
        >
          {imageUrls.map((url,index) => (
            <ImagePreview url={url} key={url + index} />
          ))}
        </ul>
      )}
      {videoUrls.length > 0 && (
        <div>
          {videoUrls.map((url,index) => (
            <VideoPreview url={url} key={url + index} />
          ))}
        </div>
      )}
      {audioUrls.length > 0 && (
        <div>
          {audioUrls.map((url,index) => (
            <AudioPreview src={url} key={url + index} />
          ))}
        </div>
      )}
      {previewUrls.length > 0 && (
        <div>
          {previewUrls.map((url,index) => (
            <HyperLink url={url} key={url + index} />
          ))}
        </div>
      )}
      {bolt11Invoices.length > 0 && (
        <div>
          {bolt11Invoices.map((url,index) => (
            <LightingInvoice url={url} key={url + index} />
          ))}
        </div>
      )}
      {lnUrls.length > 0 && (
        <div>
          {lnUrls.map((url,index) => (
            <LnUrlInvoice url={url} key={url + index} />
          ))}
        </div>
      )}
    </>
  );
}
