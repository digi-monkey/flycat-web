import { Grid } from '@mui/material';
import { UrlPreview } from 'components/URLPreview/URLPreview';
import { useTimeSince } from 'hooks/useTimeSince';
import React, { useEffect, useRef, useState } from 'react';
import { normalizeContent } from 'service/helper';
import styled from 'styled-components';
import { AudioPreview } from '../AudioPreview';
import { Avatar } from '../Avatar';
import { LightingInvoice, LnUrlInvoice } from '../LightingInvoice';
import { VideoPreview } from '../VideoPreview';
import { Dialog, DialogContent } from '@mui/material';
import styles from './index.module.scss';

export interface ContentProps {
  text: string;
  classNames?: string;
}

const Texting = ({ modifiedText }: { modifiedText: string }) => {
  const [html, setHtml] = useState<string | null>(null);
  const [plainText, setPlainText] = useState('');

  useEffect(() => {
    /*
    // Extract all the anchor tags from modifiedText
    const anchorTagRegex = /<a.*?>(.*?)<\/a>/g;
    const anchorTags = modifiedText.match(anchorTagRegex);

    // Remove all the anchor tags from modifiedText and set the rest of the content as plain text
    let plainText = modifiedText;
    if (anchorTags != null) {
      anchorTags.forEach(tag => {
        plainText = plainText.replace(tag, '');
      });
    }

    // Set the anchor tags in the state
    if (anchorTags != null) {
      const html = anchorTags.reduce((acc, tag) => {
        const m = tag.match(/<a.*href="(.*?)".*?>(.*?)<\/a>/);
        if (m != null) {
          const [, link, text] = m;
          return acc + `<a href="${link}" target="_blank">${text}</a>`;
        } else {
          return acc;
        }
      }, '');

      setHtml(html);
    }
    
    setPlainText(markdownIt.render(plainText));
    */
    setHtml(modifiedText);
  }, [modifiedText]);

  return (
    <div style={{ whiteSpace: 'pre-wrap' }}>
      {plainText}
      {html && <span dangerouslySetInnerHTML={{ __html: html }} />}
    </div>
  );
};

export function HighlightContent({text}: {text: string}){
  return <div className={styles.quoteTexts}>
    {text}
  </div>
}

export function Content({ text, classNames }: ContentProps) {
  const {
    lnUrls,
    bolt11Invoices,
    previewUrls,
    modifiedText,
    imageUrls,
    videoUrls,
    audioUrls,
  } = normalizeContent(text);
  return (
    <div className={classNames}>
      <Texting modifiedText={modifiedText} />
      <p style={{ textAlign: 'center' }}>
        {imageUrls.length > 0 &&
          imageUrls.map((url, index) => (
            <span key={url}>
              <ImagePlate url={url} />
            </span>
          ))}
      </p>
      <p>
        {videoUrls.length > 0 &&
          videoUrls.map((url, index) => (
            <span key={url}>
              <VideoPreview url={url} />
            </span>
          ))}
      </p>
      <p>
        {audioUrls.length > 0 &&
          audioUrls.map((url, index) => (
            <span key={url}>
              <AudioPreview src={url} />
            </span>
          ))}
      </p>
      <p>
        {previewUrls.length > 0 &&
          previewUrls.map(url => (
            <span key={url}>
              <UrlPreview url={url} />
            </span>
          ))}
      </p>
      <p>
        {bolt11Invoices.length > 0 &&
          bolt11Invoices.map(url => (
            <span key={url}>
              <LightingInvoice url={url} />
            </span>
          ))}
      </p>
      <p>
        {lnUrls.length > 0 &&
          lnUrls.map(url => (
            <span key={url}>
              <LnUrlInvoice url={url} />
            </span>
          ))}
      </p>
    </div>
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
            <Avatar
              picture={avatar}
              style={{ width: '40px', height: '40px', marginRight: '10px' }}
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

const Div = styled.div`
  margin: 10px 0px;
  padding: 5px;
  background: none;
  color: gray;
  cursor: pointer;
  border-radius: 5px;
  :hover {
    background: #f4f5f4;
  }
`;

export function ArticleTrendsItem({
  shareUrl,
  avatar,
  title,
  blogName,
  author,
  createdAt,
}: Omit<ArticleShareContentProps, 'text' | 'classNames'> & {
  author?: string;
  createdAt: number;
}) {
  return (
    <span>
      <Div
        onClick={() => {
          window.open(shareUrl, '_blank');
        }}
      >
        <Grid container>
          <Grid item xs={12}>
            <div style={{ fontSize: '14px', color: 'black' }}>{title}</div>
            <div style={{ fontSize: '12px', color: 'gray' }}>
              {/**
               *  
              {author}
              {' on '}
              {blogName}
              {' · '}
              {useTimeSince(createdAt)}
              */}
              {useTimeSince(createdAt)}
            </div>
          </Grid>
        </Grid>
      </Div>
    </span>
  );
}

export function ImagePlate({ url }: { url: string }) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className={styles.imagePlate}>
      <img
        src={url}
        alt="img"
        className={styles.imagePlateImg}
        onClick={() => setShowPopup(true)}
      />
      <Dialog
        open={showPopup}
        className={styles.dialog}
        onClose={() => setShowPopup(false)}
        disableAutoFocus
      >
        <DialogContent>
          <img
            src={url}
            alt='img'
            style={{
              maxWidth: '100%',
              maxHeight: '700px',
              verticalAlign: 'middle'
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
