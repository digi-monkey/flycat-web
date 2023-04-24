import { Grid } from '@mui/material';
import { Avatar } from '../Avatar';
import { UrlPreview } from 'components/URLPreview/URLPreview';
import { useTimeSince } from 'hooks/useTimeSince';
import { AudioPreview } from '../AudioPreview';
import { VideoPreview } from '../VideoPreview';
import { normalizeContent } from 'service/helper';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@mui/material';
import { LightingInvoice, LnUrlInvoice } from '../LightingInvoice';

import classname from 'classnames';
import styled from 'styled-components';
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
    <div>
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
      <ul className={classname(styles.gallery, {
        [styles.w100]: imageUrls.length === 1,
        [styles.w50]: [2, 4, 8].includes(imageUrls.length),
        [styles.w33]: ![1, 2, 4, 8].includes(imageUrls.length),
      })}>
        {imageUrls.length > 0 && imageUrls.map(url => <ImagePlate url={url} key={url} />)}
      </ul>
      <div>
        {videoUrls.length > 0 && videoUrls.map(url => <VideoPreview url={url} key={url} />)}
      </div>
      <div>
        {audioUrls.length > 0 && audioUrls.map(url => <AudioPreview src={url} key={url} />)}
      </div>
      <div>
        {previewUrls.length > 0 && previewUrls.map(url => <UrlPreview url={url} key={url} />)}
      </div>
      <div>
        {bolt11Invoices.length > 0 && bolt11Invoices.map(url => <LightingInvoice url={url} key={url} />)}
      </div>
      <div>
        {lnUrls.length > 0 && lnUrls.map(url => <LnUrlInvoice url={url} key={url} />)}
      </div>
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
      <Div onClick={() => window.open(shareUrl, '_blank')}>
        <Grid container>
          <Grid item xs={12}>
            <div style={{ fontSize: '14px', color: 'black' }}>{title}</div>
            <div style={{ fontSize: '12px', color: 'gray' }}>{useTimeSince(createdAt)}</div>
          </Grid>
        </Grid>
      </Div>
    </span>
  );
}

export function ImagePlate({ url }: { url: string }) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <li>
      <div>
        <img src={url} alt="img" onClick={() => setShowPopup(true)} />
        <Dialog
          disableAutoFocus
          open={showPopup}
          className={styles.dialog}
          onClose={() => setShowPopup(false)}
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
    </li>
  );
}
