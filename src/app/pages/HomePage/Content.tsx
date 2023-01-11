import React, { useState } from 'react';
import { extractImageUrls } from 'service/helper';

export function Content({ text }: { text: string }) {
  const { modifiedText, imageUrls } = extractImageUrls(text);
  return (
    <span style={{ whiteSpace: 'pre-line' as const }}>
      {modifiedText}
      {imageUrls.length > 0 &&
        imageUrls.map((url, index) => (
          <span key={index}>
            <ImagePlate url={url} />
          </span>
        ))}
    </span>
  );
}

export function ImagePlate({ url }: { url: string }) {
  // image hover effect
  const [scale, setScale] = useState(1);
  const handleMouseEnter = () => {
    setScale(10);
  };
  const handleMouseLeave = () => {
    setScale(1);
  };

  return (
    <img
      src={url}
      alt=""
      style={{
        width: `${48 * scale}px`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
}
