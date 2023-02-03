import { Grid } from '@mui/material';
import React, { useRef, useState } from 'react';
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

export function ArticleContentNoAvatar({
  text,
  shareUrl,
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
          <Grid
            item
            xs={12}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <span style={{ padding: '5px' }}>
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
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleClick = (event: React.MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
      setShowPopup(false);
    }
  };

  return (
    <>
      <img
        src={url}
        alt=""
        style={{
          maxWidth: '100%',
          width: `48px`,
          cursor: 'pointer',
        }}
        onClick={() => setShowPopup(true)}
      />
      {showPopup && (
        <div style={{ width: '80%', maxWidth: '800px' }}>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'gray',
              opacity: 0.6,
              zIndex: '2',
            }}
            onClick={handleClick}
          />
          <div
            ref={popupRef}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#fff',
              border: '1px solid white',
              padding: '2px',
              boxShadow: '0 0 5px white',
              zIndex: '500',
            }}
          >
            <div
              style={{ position: 'relative', width: '100%', height: '100%' }}
            >
              <img src={url} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
