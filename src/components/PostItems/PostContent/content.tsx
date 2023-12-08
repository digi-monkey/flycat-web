import { ReactNode } from 'react';
import { ParsedFragment } from './text';
import { ImagePreview } from './Media/ImagePreview';
import { VideoPreview } from './Media/VideoPreview';
import { AudioPreview } from './Media/AudioPreview';
import { LightingInvoice, LnUrlInvoice } from './Media/LightingInvoice';
import { Hashtag } from './HashTag';
import { HyperLink } from './Link';
import { NostrEmbed } from './embed/index';

import classname from 'classnames';
import styles from './Media/index.module.scss';

export const renderContent = (
  elements: ParsedFragment[],
  truncate?: number,
  isNsfw = false,
) => {
  let lenCtr = 0;

  const chunks: Array<ReactNode> = [];
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    if (truncate) {
      if (lenCtr + element.content.length > truncate) {
        lenCtr += element.content.length;
        chunks.push(
          <div className="text-frag">
            {element.content.slice(0, truncate - lenCtr)}...
          </div>,
        );
        return chunks;
      } else {
        lenCtr += element.content.length;
      }
    }

    if (element.type === 'media' && element.mimeType?.startsWith('image')) {
      const galleryImages: ParsedFragment[] = [element];
      // If the current element is of type media and mimeType starts with image,
      // we verify if the next elements are of the same type and mimeType and push to the galleryImages
      // Whenever one of the next elements is not longer of the type we are looking for, we break the loop
      for (let j = i; j < elements.length; j++) {
        const nextElement = elements[j + 1];

        if (
          nextElement &&
          nextElement.type === 'media' &&
          nextElement.mimeType?.startsWith('image')
        ) {
          galleryImages.push(nextElement);
          i++;
        } else if (
          nextElement &&
          nextElement.type === 'text' &&
          nextElement.content.trim().length === 0
        ) {
          i++; //skip over empty space text
        } else {
          break;
        }
      }
      if (galleryImages.length > 0) {
        chunks.push(
          <ul
            className={classname(styles.gallery, {
              [styles.w100]: galleryImages.length === 1,
              [styles.w50]: [2, 4, 8].includes(galleryImages.length),
              [styles.w33]: ![1, 2, 4, 8].includes(galleryImages.length),
              [styles.blur]: isNsfw === true,
            })}
          >
            {galleryImages.map((img, index) => (
              <ImagePreview url={img.content} key={img.content + index} />
            ))}
          </ul>,
        );
      }
    }

    if (element.type === 'media' && element.mimeType?.startsWith('video')) {
      chunks.push(<VideoPreview url={element.content} />);
    }

    if (element.type === 'media' && element.mimeType?.startsWith('audio')) {
      chunks.push(<AudioPreview src={element.content} />);
    }

    if (element.type === 'bolt11Invoices') {
      chunks.push(<LightingInvoice url={element.content} />);
    }

    if (element.type === 'lnUrls') {
      chunks.push(<LnUrlInvoice url={element.content} />);
    }

    if (element.type === 'mention') {
      chunks.push(<NostrEmbed key={i} data={element} />);
    }

    if (element.type === 'hashtag') {
      chunks.push(<Hashtag tag={element.content} />);
    }

    if (
      element.type === 'link' ||
      (element.type === 'media' && element.mimeType?.startsWith('unknown'))
    ) {
      chunks.push(<HyperLink url={element.content} />);
    }

    if (element.type === 'custom_emoji') {
      chunks.push(
        <img
          src={element.content}
          width={15}
          height={15}
          className="custom-emoji"
        />,
      );
    }

    if (element.type === 'text') {
      chunks.push(<span>{element.content}</span>);
    }
  }
  return chunks;
};
