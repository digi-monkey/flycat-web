import { Grid } from '@mui/material';
import { ArticleContentNoAvatar, Content } from 'app/components/layout/Content';
import ReplyButton from 'app/components/layout/ReplyBtn';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Event, PrivateKey, PublicKey } from 'service/api';
import { shortPublicKey } from 'service/helper';
import { useTimeSince } from 'hooks/useTimeSince';
import { ShowThread } from './ShowThread';
import { ShareArticle } from './Share';
import defaultAvatar from '../../../resource/logo512.png';

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

interface KeyPair {
  publicKey: PublicKey;
  privateKey: PrivateKey;
}

export interface TextMsgProps {
  name?: string;
  avatar?: string;
  pk: string;
  replyTo: { name?: string; pk: string }[];
  content: string;
  createdAt: number;
  eventId: string;
  keyPair?: KeyPair;
  style?: React.CSSProperties;
}

export const TextMsg = ({
  replyTo,
  avatar,
  name,
  pk,
  content,
  createdAt,
  eventId,
  keyPair,
  style,
}: TextMsgProps) => {
  const { t } = useTranslation();
  const [hover, setHover] = React.useState(false);
  const bg = { backgroundColor: hover ? '#f5f5f5' : 'white' };
  return (
    <li
      style={{ ...styles.msgItem, ...bg, ...style }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Grid container spacing={1}>
        <Grid item xs={2}>
          <img style={styles.avatar} src={avatar || defaultAvatar} alt="" />
        </Grid>
        <Grid item xs={10}>
          <span style={styles.msgWord}>
            <a style={styles.userName} href={'/user/' + pk}>
              @{name}
            </a>
            {replyTo.length > 0 && (
              <span style={{ color: 'gray' }}>
                {t('textMsg.replyTo')}{' '}
                {replyTo.map((r, i) => (
                  <a
                    key={i}
                    style={{ ...styles.userName, ...{ color: 'gray' } }}
                    href={'/user/' + r.pk}
                  >
                    @{r.name || shortPublicKey(r.pk!)}
                  </a>
                ))}
              </span>
            )}
            <Content text={content} />
          </span>
          <span style={styles.time}>{useTimeSince(createdAt)}</span>
          <span style={styles.time}>
            <ShowThread eventId={eventId} />
          </span>
          <span style={styles.time}>
            <ReplyButton
              replyToEventId={eventId}
              replyToPublicKey={pk}
              myKeyPair={keyPair}
            />
          </span>
        </Grid>
      </Grid>
    </li>
  );
};

export const ProfileTextMsg = ({
  replyTo,
  pk,
  content,
  createdAt,
  eventId,
  keyPair,
}: Omit<TextMsgProps, 'avatar' | 'name'>) => {
  const { t } = useTranslation();
  const [hover, setHover] = React.useState(false);
  const bg = { backgroundColor: hover ? '#f5f5f5' : 'white' };

  return (
    <li
      style={{ ...styles.msgItem, ...bg }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Grid container>
        <Grid item xs={12}>
          <span style={styles.msgWord}>
            {replyTo.length > 0 && (
              <span>
                {t('textMsg.replyTo')}{' '}
                {replyTo.map((r, i) => (
                  <a key={i} style={styles.userName} href={'/user/' + r.pk}>
                    @{r.name || shortPublicKey(r.pk!)}
                  </a>
                ))}
              </span>
            )}
            <Content text={content} />
          </span>
          <span style={styles.time}>{useTimeSince(createdAt)}</span>
          <span style={styles.time}>
            <ShowThread eventId={eventId} />
          </span>
          <span style={styles.time}>
            <ReplyButton
              replyToEventId={eventId}
              replyToPublicKey={pk}
              myKeyPair={keyPair}
            />
          </span>
        </Grid>
      </Grid>
    </li>
  );
};

export interface BlogMsgProps {
  name?: string;
  avatar?: string;
  pk: string;
  title: string;
  blogName: string;
  articleId: string;
  createdAt: number;
  keyPair?: KeyPair;
  onSubmitShare: (event: Event) => any;
}

export const BlogMsg = ({
  avatar,
  name,
  pk,
  title,
  blogName,
  articleId,
  createdAt,
  keyPair,
  onSubmitShare,
}: BlogMsgProps) => {
  const { t } = useTranslation();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [hover, setHover] = React.useState(false);
  const bg = { backgroundColor: hover ? '#f5f5f5' : 'white' };

  const shareUrl = () => {
    return (
      ' ' +
      window.location.protocol +
      '//' +
      window.location.host +
      '/article/' +
      pk +
      '/' +
      articleId
    );
  };

  return (
    <li
      style={{ ...styles.msgItem, ...bg }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Grid container>
        <Grid item xs={12} sm={2} style={{ textAlign: 'left' as const }}>
          <img style={styles.avatar} src={avatar} alt="" />
        </Grid>
        <Grid item xs={12} sm={10}>
          <span style={styles.msgWord}>
            <a style={styles.userName} href={'/user/' + pk}>
              @{name}
            </a>
            <ArticleContentNoAvatar
              text={''}
              shareUrl={shareUrl()}
              title={title}
              blogName={blogName}
            />
          </span>
          <span style={styles.time}>{useTimeSince(createdAt)}</span>
          <span style={styles.time}>
            <button
              onClick={() => setIsShareModalOpen(true)}
              style={styles.smallBtn}
            >
              {t('blog.rePostShare')}
            </button>
          </span>
          <ShareArticle
            suffix={' ' + shareUrl()}
            url={shareUrl()}
            title={title}
            blogName={blogName}
            blogAvatar={avatar}
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            pk={pk}
            id={articleId}
            loginUser={keyPair}
            onSubmit={onSubmitShare}
          />
        </Grid>
      </Grid>
    </li>
  );
};
