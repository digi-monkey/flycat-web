import { Grid } from '@mui/material';
import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import { ProfileAvatar, ProfileName } from 'app/components/layout/msg/TextMsg';
import { useCallWorker } from 'hooks/useWorker';
import React, { useEffect, useState } from 'react';
import {
  deserializeMetadata,
  EventSetMetadataContent,
  EventSubResponse,
  isEventPTag,
  isEventSubResponse,
  PublicKey,
  WellKnownEventKind,
} from 'service/api';
import { maxStrings } from 'service/helper';
import { Article, Nip23 } from 'service/nip/23';
import { UserMap } from 'service/type';
import { CallRelayType } from 'service/worker/type';

export function BlogFeeds() {
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [articles, setArticles] = useState<Article[]>([]);

  const { worker, newConn } = useCallWorker({
    onMsgHandler,
    updateWorkerMsgListenerDeps: [],
  });
  function onMsgHandler(data: any, relayUrl?: string) {
    const msg = JSON.parse(data);
    if (isEventSubResponse(msg)) {
      const event = (msg as EventSubResponse)[2];
      //console.log(event);
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
  }

  useEffect(() => {
    if (newConn.length === 0) return;

    const filter = Nip23.filter({ overrides: { limit: 50 } });
    const callRelay = {
      type: CallRelayType.batch,
      data: newConn,
    };
    worker?.subFilter(filter, undefined, undefined, callRelay);
  }, [newConn, worker]);

  const articlesRef = React.useRef<Article[]>([]);

  useEffect(() => {
    const prevArticles = articlesRef.current;
    const newArticles = articles.filter(
      article => !prevArticles.map(p => p.eventId).includes(article.eventId),
    );
    console.log('New articles added:', newArticles.length);
    articlesRef.current = articles;

    const pks = newArticles.map(a => a.pubKey);
    if (pks.length === 0) return;

    const callRelay = {
      type: CallRelayType.batch,
      data: newConn,
    };
    worker?.subMetadata(pks, undefined, undefined, callRelay);
  }, [articles]);

  return (
    <div>
      {articles.map(a => (
        <ArticleListItem article={a} userMap={userMap} />
      ))}
    </div>
  );
}

const ArticleListItem = ({
  article: a,
  userMap,
}: {
  article: Article;
  userMap: UserMap;
}) => {
  return (
    <div key={a.eventId} style={{ margin: '10px 0px' }}>
      <li
        style={{
          display: 'block',
          borderBottom: '1px dashed #ddd',
          padding: '15px 0',
        }}
      >
        <Grid
          container
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-start',
          }}
        >
          <div style={{ width: '75px' }}>
            <ProfileAvatar
              name={a.pubKey}
              picture={userMap.get(a.pubKey)?.picture}
            />
          </div>
          <div style={{ flex: '1' }}>
            <span style={{ fontSize: '14px', display: 'block' }}>
              <ProfileName
                name={userMap.get(a.pubKey)?.name}
                createdAt={a.updated_at}
                pk={a.pubKey}
              />
              <div
                style={{
                  display: 'flex',
                  // alignItems: 'center',
                  border: '1px solid #dbd5d5',
                  padding: '10px',
                  margin: '5px 0px',
                  cursor: 'pointer',
                }}
                onClick={() =>
                  window.open('/post/' + a.pubKey + '/' + a.id, '__blank')
                }
              >
                {a.image && (
                  <span
                    style={{
                      width: '100px',
                      height: '100px',
                      marginRight: '10px',
                    }}
                  >
                    <img
                      src={a.image}
                      alt={a.title}
                      style={{ maxWidth: '100px', maxHeight: '100%' }}
                    />
                  </span>
                )}
                <div style={{ overflow: 'scroll' }}>
                  {a.title && (
                    <span
                      style={{
                        fontSize: '16px',
                        marginBottom: '5px',
                        display: 'block',
                      }}
                    >
                      {a.title}
                    </span>
                  )}
                  {a.summary && (
                    <p style={{ fontSize: '12px', color: 'gray' }}>
                      {maxStrings(a.summary, 140)}
                    </p>
                  )}
                </div>
              </div>
            </span>
          </div>
        </Grid>
      </li>
    </div>
  );
};
