import React, { useState } from 'react';
import { normalizeContent } from 'service/helper';

export function Content({
  text,
  classNames,
}: {
  text: string;
  classNames?: string;
}) {
  const { modifiedText, imageUrls } = normalizeContent(text);
  return (
    <span className={classNames}>
      <span
        className={classNames}
        style={{ whiteSpace: 'pre-line' as const }}
        dangerouslySetInnerHTML={{ __html: modifiedText }}
      ></span>
      <span>
        {imageUrls.length > 0 &&
          imageUrls.map((url, index) => (
            <span key={index}>
              <ImagePlate url={url} />
            </span>
          ))}
      </span>
    </span>
  );
}

export function ImagePlate({ url }: { url: string }) {
  // image click effect
  const [scale, setScale] = useState(1);

  const handleFocus = () => {
    console.log('foucs...');
    setScale(10);
  };
  const handleBlur = () => {
    setScale(1);
  };

  return (
    <img
      src={url}
      alt=""
      style={{
        width: `${48 * scale}px`,
        cursor: 'pointer',
      }}
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
