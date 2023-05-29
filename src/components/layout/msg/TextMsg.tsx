import { Nip08 } from 'service/nip/08';
import { Event } from 'service/api';
import { Paths } from 'constants/path';
import { Repost } from './reaction/Repost';
import { Delete } from './reaction/Delete';
import { Tipping } from './reaction/Tipping';
import { UserMap } from 'service/type';
import { Bookmark } from './reaction/Bookmark';
import { CallWorker } from 'service/worker/callWorker';
import { isEmptyStr } from 'service/helper';
import { ShowThread } from './reaction/ShowThread';
import { ShareArticle } from './Share';
import { useTimeSince } from 'hooks/useTimeSince';
import { Grid, Popover } from '@mui/material';
import { EventWithSeen } from 'pages/type';
import { CallRelayType } from 'service/worker/type';
import { useTranslation } from 'next-i18next';
import { ReactToUserList } from './ReplyToUserList';
import { useEffect, useMemo, useState } from 'react';
import { ArticleContentNoAvatar, Content } from 'components/layout/msg/content';

import Link from 'next/link';
import ReplyButton from 'components/layout/msg/reaction/ReplyBtn';
import BroadcastOnPersonalIcon from '@mui/icons-material/BroadcastOnPersonal';
import { Nip19 } from 'service/nip/19';
import { Nip21 } from 'service/nip/21';
import { seedGroups } from 'service/relay/group/seed';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useLoadSelectedRelays } from 'components/RelaySelector/hooks/useLoadSelectedRelays';
import { Relay } from 'service/relay/type';

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
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    maxWidth: '100%',
  },
  msgWord: {
    fontSize: '14px',
    display: 'block',
    wordBreak: "break-all" as const
  },
  userName: {
    color: 'black',
    fontSize: '15px',
    fontWeight: '500',
    marginRight: '5px',
  },
  time: {
    color: 'gray',
    fontSize: '12px',
    marginTop: '5px',
  },
  reaction: {
    color: 'gray',
    fontSize: '12px',
    marginTop: '5px',
  },
  smallBtn: {
    fontSize: '12px',
    //marginLeft: '5px',
    border: 'none' as const,
    background: 'none',
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

export interface TextMsgProps {
  userMap: UserMap;
  replyTo: { name?: string; pk: string }[];
  worker: CallWorker;
  relays?: string[];
  msgEvent: EventWithSeen;
  lightingAddress?: string;
}


export const ProfileAvatar = ({
  picture,
  name,
  style,
}: {
  picture?: string;
  name?: string;
  style?: React.CSSProperties;
}) => {
  const theme = 'marble';
  const defaultUrl = `https://source.boringavatars.com/${theme}/60/${
    name || Date.now().toString()
  }?color=65A766,F1CF4D,148F8D`;
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    if (picture != null) {
      setUrl(picture);
    }
  }, [picture]);

  const handleError = () => {
    setUrl(defaultUrl);
  };

  return (
    <img
      style={{ ...styles.avatar, ...style }}
      src={url || defaultUrl}
      alt=""
      onError={handleError}
    />
  );
};

export const ProfileName = ({
  name,
  pk,
  createdAt,
}: {
  name?: string;
  pk: string;
  createdAt: number;
}) => {
  return (
    <div>
      <Link style={styles.userName} href={Paths.user + pk}>
        @{name || '__'}{' '}
      </Link>
      <span style={styles.time}>
        {' · '}
        {useTimeSince(createdAt)}
      </span>
    </div>
  );
};

export const ReactionGroups = ({
  msgEvent,
  eventId,
  worker,
  pk,
  seen,
  relays,
  lightingAddress,
}: {
  msgEvent: EventWithSeen;
  worker: CallWorker;
  pk: string;
  eventId: string;
  seen?: string[];
  relays?: string[];
  lightingAddress?: string;
}) => {
  const { t } = useTranslation();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <div style={{ marginTop: '15px' }}>
      <span>
        <span style={styles.reaction} onClick={handleClick}>
          {seen?.map(url => (
            <span key={url} style={{ color: 'green' }}>
              |
            </span>
          ))}
          {relays
            ?.filter(r => !seen?.includes(r))
            .map(url => (
              <span key={url} style={{ color: '#c6c0c0' }}>
                |
              </span>
            ))}
        </span>
        <Popover
          id={'popup:' + eventId}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <div style={{ padding: '10px', fontSize: '14px', width: '180px' }}>
            <div style={{ display: 'block' }}>{t('seen.title')}</div>
            <div>
              {seen &&
                seen.length > 0 &&
                seen
                  ?.filter(url => url != null && url !== '')
                  .map(url => <li key={url}>{url}</li>)}
            </div>

            <button
              style={{ width: '100%', marginTop: '10px' }}
              onClick={() => {
                const event = getEventFromTextNoteEvent(msgEvent);
                const pubToRelays =
                  relays?.filter(r => !seen?.includes(r)).map(url => url) || [];
                if (pubToRelays.length > 0) {
                  worker.pubEvent(event, {
                    type: CallRelayType.batch,
                    data: pubToRelays,
                  });
                  alert(
                    `broadcast to ${pubToRelays.length} relays, please refresh page!`,
                  );
                }
              }}
            >
              <BroadcastOnPersonalIcon style={{ verticalAlign: 'middle' }} /> {t('seen.broadcast')}
            </button>
          </div>
        </Popover>

        <span style={styles.reaction}>
          {!isEmptyStr(lightingAddress) && (
            <Tipping address={lightingAddress!} />
          )}
        </span>
        {/*
        <span
          style={styles.reaction}
          onClick={() => {
            alert('working on it!');
          }}
        >
          <Like toEventId={eventId} toPublicKey={pk} worker={worker} />
        </span>
        */}
        <span
          style={styles.reaction}
          onClick={() => {
            alert('working on it!');
          }}
        >
          <Repost eventId={eventId} />
        </span>
        <span
          style={styles.reaction}
          onClick={() => {
            alert('working on it!');
          }}
        >
          <Bookmark eventId={eventId} />
        </span>

        <span style={styles.reaction}>
          <ShowThread eventId={eventId} />
        </span>
        <span style={styles.reaction}>
          <ReplyButton
            replyToEventId={eventId}
            replyToPublicKey={pk}
            worker={worker}
          />
        </span>
      </span>
    </div>
  );
};

export const ProfileReactionGroups = ({
  eventId,
  worker,
  pk,
  lightingAddress,
  createdAt,
}: {
  worker: CallWorker;
  pk: string;
  eventId: string;
  createdAt: number;
  lightingAddress?: string;
}) => {
  return (
    <div style={{ marginTop: '15px' }}>
      <span style={styles.time}>{useTimeSince(createdAt)}</span>

      <span style={{ marginLeft: '15px' }}>
        {!isEmptyStr(lightingAddress) && (
          <span style={styles.reaction}>
            <Tipping address={lightingAddress!} />
          </span>
        )}
        <span style={styles.reaction}>
          <Repost eventId={eventId} />
        </span>
        <span style={styles.reaction}>
          <Bookmark eventId={eventId} />
        </span>
        <span style={styles.reaction}>
          <Delete eventId={eventId} />
        </span>
        <span style={styles.reaction}>
          <ShowThread eventId={eventId} />
        </span>
        <span style={styles.reaction}>
          <ReplyButton
            replyToEventId={eventId}
            replyToPublicKey={pk}
            worker={worker}
          />
        </span>
      </span>
    </div>
  );
};

export const TextMsg = ({
  replyTo,
  userMap,
  worker,
  relays,
  msgEvent,
  lightingAddress,
}: TextMsgProps) => {
  const { t } = useTranslation();
  const bg = { backgroundColor: 'white' };
  const myPublicKey = useReadonlyMyPublicKey();
  
  const [content, setContent] = useState<string>(msgEvent.content);
  const [relayUrls, setRelayUrls] = useState<string[]>([]);

  useLoadSelectedRelays(myPublicKey, (r: Relay[])=>{setRelayUrls(r.map(r=>r.url))});

  const updateContent = async () => {
    let content = msgEvent.content;

    content = await Nip21.replaceNprofile(msgEvent, userMap, relayUrls);
    content = Nip21.replaceNote(content, userMap);
    content = Nip21.replaceNevent(content, userMap);
    content = Nip21.replaceNpub(content, userMap);
    content = Nip08.replaceMentionPublickey(msgEvent, userMap);
    content = Nip08.replaceMentionEventId(msgEvent);

    setContent(content);
  };

  useEffect(()=>{
    updateContent()
  }, [msgEvent, userMap]);

  return (
    <li
      style={{
        display: 'block',
        borderBottom: '1px dashed #ddd',
        padding: '15px 0',
        wordBreak: 'break-all',
      }}
      key={msgEvent.id}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          display: 'flex',
          justifyContent: 'flex-start',
        }}
      >
        <div style={{ width: '75px', minWidth: '75px' }}>
          <ProfileAvatar
            name={msgEvent.pubkey}
            picture={userMap.get(msgEvent.pubkey)?.picture}
          />
        </div>
        <div style={{ flex: '1', maxWidth: '100%' }}>
          <div style={{ fontSize: '14px', display: 'block' }}>
            <ProfileName
              name={userMap.get(msgEvent.pubkey)?.name}
              createdAt={msgEvent.created_at}
              pk={msgEvent.pubkey}
            />
            <ReactToUserList reactTo={replyTo} />
            <Content text={content} />
          </div>

          <ReactionGroups
            msgEvent={msgEvent}
            worker={worker!}
            pk={msgEvent.pubkey}
            eventId={msgEvent.id}
            seen={msgEvent.seen}
            relays={relays}
            lightingAddress={lightingAddress}
          />
        </div>
      </div>
    </li>
  );
};

export const ProfileTextMsg = ({
  replyTo,
  worker,
  lightingAddress,
  msgEvent,
  userMap,
}: TextMsgProps) => {
  const { t } = useTranslation();
  const [hover, setHover] = useState(false);
  //const bg = { backgroundColor: hover ? '#f5f5f5' : 'white' };
  const bg = { backgroundColor: 'white' };

  const content = useMemo(() => {
    const event = msgEvent;
    event.content = Nip08.replaceMentionPublickey(event, userMap);
    event.content = Nip08.replaceMentionEventId(event);
    return event.content;
  }, [msgEvent, userMap]);

  return (
    <li
      style={{ ...styles.msgItem, ...bg }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Grid container>
        <Grid item xs={12}>
          <div style={styles.msgWord}>
            <ReactToUserList reactTo={replyTo} />
            <Content text={content} />
          </div>
          <ProfileReactionGroups
            eventId={msgEvent.id}
            pk={msgEvent.pubkey}
            createdAt={msgEvent.created_at}
            worker={worker}
            lightingAddress={lightingAddress}
          />
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
  onSubmitShare,
}: BlogMsgProps) => {
  const { t } = useTranslation();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [hover, setHover] = useState(false);
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
      encodeURIComponent(articleId)
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
          <ProfileAvatar picture={avatar} name={pk} />
        </Grid>
        <Grid item xs={12} sm={10}>
          <div style={styles.msgWord}>
            <ProfileName name={name} pk={pk} createdAt={createdAt} />
            <ArticleContentNoAvatar
              text={''}
              shareUrl={shareUrl()}
              title={title}
              blogName={blogName}
            />
          </div>
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
            onSubmit={onSubmitShare}
          />
        </Grid>
      </Grid>
    </li>
  );
};

export const ProfileBanner = ({
  picture,
  name,
  style,
}: {
  picture?: string;
  name?: string;
  style?: React.CSSProperties;
}) => {
  const [url, setUrl] = useState<string | undefined>();
  const defaultUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  useEffect(() => {
    if (picture != null) {
      setUrl(picture);
    }
  }, [picture]);

  const handleError = () => {
    setUrl(defaultUrl);
  };

  return (
    <img
      style={{
        ...{
          width: '100%',
          maxHeight: '150px',
          maxWidth: '100%',
        },
        ...style,
      }}
      src={url || defaultUrl}
      alt=""
      onError={handleError}
    />
  );
};

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getEventFromTextNoteEvent(data: EventWithSeen): Event {
  return {
    id: data.id,
    pubkey: data.pubkey,
    content: data.content,
    created_at: data.created_at,
    sig: data.sig,
    kind: data.kind,
    tags: data.tags,
  };
}
