import { Grid } from '@mui/material';
import { Content } from 'app/components/layout/Content';
import ReplyButton from 'app/components/layout/ReplyBtn';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { PrivateKey, PublicKey } from 'service/api';
import { shortPublicKey } from 'service/helper';
import { useTimeSince } from 'hooks/useTimeSince';
import { ShowThread } from './ShowThread';
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
}: TextMsgProps) => {
  const { t } = useTranslation();
  return (
    <li style={styles.msgItem}>
      <Grid container>
        <Grid item xs={2} style={{ textAlign: 'left' as const }}>
          <img style={styles.avatar} src={avatar} alt="" />
        </Grid>
        <Grid item xs={10}>
          <span style={styles.msgWord}>
            <a style={styles.userName} href={'/user/' + pk}>
              @{name}
            </a>
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

export const ProfileTextMsg = ({
  replyTo,
  pk,
  content,
  createdAt,
  eventId,
  keyPair,
}: Omit<TextMsgProps, 'avatar' | 'name'>) => {
  const { t } = useTranslation();
  return (
    <li style={styles.msgItem}>
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
