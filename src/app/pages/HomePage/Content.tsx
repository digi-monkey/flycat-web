import { Grid } from '@mui/material';
import React, { useState } from 'react';
import { PublicKey } from 'service/api';
import { normalizeContent } from 'service/helper';

export interface ContentProps {
  text: string;
  classNames?: string;
}

export function Content({ text, classNames }: ContentProps) {
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

export interface ArticleShareContentProps {
  text: string;
  classNames?: string;
  shareUrl: string;
  avatar?: string;
  title: string;
  blogName: string;
}

export function ArticleShareContent({
  text,
  shareUrl,
  avatar,
  title,
  blogName,
  classNames,
}: ArticleShareContentProps) {
  return (
    <span className={classNames}>
      <span className={classNames} style={{ whiteSpace: 'pre-line' as const }}>
        {text}
      </span>
      <div
        style={{
          margin: '10px 0px',
          background: 'rgb(247, 245, 235)',
          padding: '5px',
        }}
        onClick={() => {
          window.open(shareUrl, '_blank');
        }}
      >
        <Grid container>
          <Grid item xs={12} style={{ display: 'flex', alignItems: 'center' }}>
            <img
              style={{ width: '40px', height: '40px', marginRight: '10px' }}
              src={avatar}
              alt="avatar"
            />
            <span>
              {title} - {blogName}
            </span>
          </Grid>
        </Grid>
      </div>
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
