import { Grid } from '@mui/material';
import { Article } from 'pages/legacy-blog/Article';
import { useTimeSince } from 'hooks/useTimeSince';
import React from 'react';
import { EventSetMetadataContent, PublicKey } from 'service/api';
import {
  ArticleDataSchema,
  SiteMetaDataContentSchema,
} from 'service/flycat-protocol';

const styles = {
  root: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  title: {
    color: 'black',
    fontSize: '2em',
    fontWeight: '380',
    diplay: 'block',
    width: '100%',
    margin: '5px',
  },
  ul: {
    padding: '10px',
    background: 'white',
    borderRadius: '5px',
  },
  li: {
    display: 'inline',
    padding: '10px',
  },
  content: {
    margin: '5px 0px',
    minHeight: '700px',
    background: 'white',
    borderRadius: '5px',
  },
  left: {
    height: '100%',
    minHeight: '700px',
    padding: '20px',
  },
  right: {
    minHeight: '700px',
    backgroundColor: '#E1D7C6',
    padding: '20px',
  },
  postBox: {},
  postHintText: {
    color: '#acdae5',
    marginBottom: '5px',
  },
  postTextArea: {
    resize: 'none' as const,
    boxShadow: 'inset 0 0 1px #aaa',
    border: '1px solid #b9bcbe',
    width: '100%',
    height: '80px',
    fontSize: '14px',
    padding: '5px',
    overflow: 'auto',
  },
  btn: {
    display: 'box',
    textAlign: 'right' as const,
  },
  message: {
    marginTop: '5px',
  },
  msgsUl: {
    padding: '5px',
  },
  msgItem: {
    display: 'block',
    borderBottom: '1px dashed #ddd',
    padding: '15px 0',
  },
  avatar: {
    display: 'block',
    width: '60px',
    height: '60px',
  },
  msgWord: {
    fontSize: '14px',
    display: 'block',
  },
  userName: {
    textDecoration: 'underline',
    marginRight: '5px',
  },
  time: {
    color: 'gray',
    fontSize: '12px',
    marginTop: '5px',
  },
  smallBtn: {
    fontSize: '12px',
    marginLeft: '5px',
    border: 'none' as const,
  },
  connected: {
    fontSize: '18px',
    fontWeight: '500',
    color: 'green',
  },
  disconnected: {
    fontSize: '18px',
    fontWeight: '500',
    color: 'red',
  },
  userProfileAvatar: {
    width: '60px',
    height: '60px',
  },
  userProfileName: {
    fontSize: '20px',
    fontWeight: '500',
  },
};

export interface ArticleMsgProps {
  isOwner: boolean;
  author: EventSetMetadataContent & { created_at: number };
  publicKey: PublicKey;
  siteMetaData: SiteMetaDataContentSchema;
  article: ArticleDataSchema & {
    page_id: number;
  };
  submitUpdateArticle: (
    article: ArticleDataSchema & {
      page_id: number;
    },
  ) => Promise<void>;
  subArticlePages: (
    siteMetaData: SiteMetaDataContentSchema,
    relays?: string[],
  ) => Promise<void>;
}

export const ArticleMsg = ({
  isOwner,
  author,
  publicKey,
  siteMetaData,
  article,
  submitUpdateArticle,
  subArticlePages,
}: ArticleMsgProps) => {
  return (
    <li style={styles.msgItem}>
      <Grid container>
        <Grid item xs={12}>
          <div style={styles.msgWord}>
            <Article
              isOwner={isOwner}
              publicKey={publicKey}
              author={author}
              siteMetaData={siteMetaData!}
              article={article}
              onUpdateSubmit={submitUpdateArticle}
              onRefreshArticlePage={() => {
                subArticlePages(siteMetaData!);
              }}
            />
          </div>
          <span style={styles.time}>{useTimeSince(article.created_at)}</span>
        </Grid>
      </Grid>
    </li>
  );
};
