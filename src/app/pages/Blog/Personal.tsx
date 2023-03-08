import React, { useState, useEffect } from 'react';
import {
  EventSetMetadataContent,
  WellKnownEventKind,
  PublicKey,
  RelayUrl,
  PetName,
  deserializeMetadata,
  Event,
} from 'service/api';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import { CallRelay, CallRelayType } from 'service/worker/type';
import { UserMap } from 'service/type';
import { useTranslation } from 'react-i18next';
import { loginMapStateToProps } from 'app/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { Article, Nip23 } from 'service/nip/23';
import { useTimeSince } from 'hooks/useTimeSince';
import { ThinHr } from 'app/components/layout/ThinHr';
import { Book } from './Book';
import EditIcon from '@mui/icons-material/Edit';
import { ProfileAvatar } from 'app/components/layout/msg/TextMsg';
import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import { useTheme } from '@mui/material';
import { DateBook } from './DateBook';
import { TagItem } from './hashTags/TagItem';

export const styles = {
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
    width: '80px',
    height: '80px',
    marginRight: '10px',
  },
  userProfileName: {
    fontSize: '20px',
    fontWeight: '500',
  },
  userProfileBtnGroup: {
    marginTop: '20px',
  },
};

export type ContactList = Map<
  PublicKey,
  {
    relayer: RelayUrl;
    name: PetName;
  }
>;
interface UserParams {
  publicKey: string;
}

export const PersonalBlog = ({ isLoggedIn, signEvent }) => {
  const { t } = useTranslation();
  const { publicKey } = useParams<UserParams>();
  const myPublicKey = useReadonlyMyPublicKey();
  const theme = useTheme();

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [articles, setArticles] = useState<Article[]>([]);

  const { worker, newConn } = useCallWorker();

  function handleEvent(event: Event, relayUrl?: string) {
    switch (event.kind) {
      case WellKnownEventKind.set_metadata:
        const metadata: EventSetMetadataContent = deserializeMetadata(
          event.content,
        );
        setUserMap(prev => {
          const newMap = new Map(prev);
          const oldData = newMap.get(event.pubkey);
          if (oldData && oldData.created_at > event.created_at) {
            // the new data is outdated
            return newMap;
          }

          newMap.set(event.pubkey, {
            ...metadata,
            ...{ created_at: event.created_at },
          });
          return newMap;
        });
        break;

      case WellKnownEventKind.long_form:
        const article = Nip23.toArticle(event);
        setArticles(prev => {
          if (prev.map(p => p.eventId).includes(event.id)) return prev;

          const index = prev.findIndex(p => p.id === article.id);
          if (index !== -1) {
            const old = prev[index];
            if (old.updated_at >= article.updated_at) {
              return prev;
            } else {
              return prev.map((p, id) => {
                if (id === index) return article;
                return p;
              });
            }
          }

          // only add un-duplicated and replyTo msg
          const newItems = [...prev, article];
          // sort by timestamp in asc
          const sortedItems = newItems.sort((a, b) =>
            a.updated_at >= b.updated_at ? -1 : 1,
          );
          return sortedItems;
        });
        break;

      default:
        break;
    }
  }

  useEffect(() => {
    // todo: validate publicKey
    if (publicKey.length === 0) return;
    if (newConn.length === 0) return;

    const pks = [publicKey];
    if (isLoggedIn && myPublicKey.length > 0) {
      pks.push(myPublicKey);
    }

    const callRelay: CallRelay = {
      type: CallRelayType.batch,
      data: newConn,
    };
    worker
      ?.subMetadata(pks, undefined, undefined, callRelay)
      ?.iterating({ cb: handleEvent });
    worker
      ?.subNip23Posts({ pks: [publicKey], callRelay })
      ?.iterating({ cb: handleEvent });
  }, [newConn]);

  const directorys: string[][] = articles
    .filter(a => a.dirs != null)
    .map(a => a.dirs!);

  return (
    <BaseLayout>
      <Left>
        <div style={{ marginBottom: '20px', height: '100%' }}>
          <ProfileAvatar
            picture={userMap.get(publicKey)?.picture}
            name={publicKey}
          />
          <span style={{ marginLeft: '10px' }}>
            <a style={styles.userName} href={'/user/' + publicKey}>
              @{userMap.get(publicKey)?.name || '__'}{' '}
            </a>
          </span>
        </div>

        <div style={styles.message}>
          <ul style={{ padding: '0', marginTop: '20px' }}>
            <h3>{'Collection'}</h3>
            <DateBook articles={articles} />
            {directorys
              .map(dirs => dirs[0])
              .filter((value, index, array) => array.indexOf(value) === index)
              .map(dir => (
                <span style={{ paddingRight: '20px' }}>
                  <Book
                    key={dir}
                    title={dir}
                    count={
                      articles.filter(a => a.dirs && a.dirs[0] === dir).length
                    }
                    time={
                      articles.filter(a => a.dirs && a.dirs[0] === dir)[0]
                        .published_at
                    }
                  />
                </span>
              ))}
          </ul>
        </div>

        <ThinHr></ThinHr>
        <h3>{'Articles'}</h3>
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            background: 'rgb(244, 245, 244)',
          }}
        >
          {articles.map(article => (
            <MiniArticleItem
              article={article}
              isOwner={publicKey === myPublicKey}
              authorPk={publicKey}
            />
          ))}
        </div>
      </Left>
      <Right>
        <div style={{ marginTop: '40px' }}>
          {articles
            .map(article => article.hashTags)
            .flat(Infinity)
            .filter(t => typeof t === 'string')
            .map(t => (
              <TagItem tag={t as string} />
            ))}
        </div>
      </Right>
    </BaseLayout>
  );
};

export interface MiniArticleItemProps {
  article: Article;
  authorPk: string;
  isOwner: boolean;
}

export function MiniArticleItem({ article, authorPk, isOwner }) {
  return (
    <div
      style={{
        display: 'block',
        borderBottom: '1px dashed #ddd',
        padding: '15px 0',
        fontSize: '14px',
      }}
    >
      <a
        href={'/post/' + authorPk + '/' + article.id}
        target="_blank"
        rel="noreferrer"
        style={{
          textTransform: 'capitalize',
        }}
      >
        {article.title}
      </a>

      {isOwner && (
        <span style={{ float: 'right' as const }}>
          <a href={'/edit/' + authorPk + '/' + article.id}>
            <EditIcon style={{ height: '14px' }} />
          </a>
          &nbsp;
        </span>
      )}

      <span
        style={{
          color: 'gray',
          fontSize: '12px',
          marginTop: '5px',
          display: 'block',
        }}
      >
        {useTimeSince(article.updated_at)}
      </span>
    </div>
  );
}

export default connect(loginMapStateToProps)(PersonalBlog);
