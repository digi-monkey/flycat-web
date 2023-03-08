import { loginMapStateToProps } from '../../helper';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import { useTranslation } from 'react-i18next';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { UserMap } from 'service/type';
import { defaultLastNotifyTime, get, update } from 'service/last-notify';
import {
  deserializeMetadata,
  Event,
  EventSetMetadataContent,
  EventTags,
  isEventPTag,
  WellKnownEventKind,
} from 'service/api';
import { CallRelayType } from 'service/worker/type';
import { ProfileAvatar } from 'app/components/layout/msg/TextMsg';
import { maxStrings } from 'service/helper';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { CallWorker } from 'service/worker/callWorker';
import { Content } from 'app/components/layout/msg/Content';
import { Nip23 } from 'service/nip/23';

export interface ItemProps {
  msg: Event;
  eventId: string;
  userMap: UserMap;
  worker: CallWorker;
}

export function LikeItem({ msg, eventId, userMap, worker }: ItemProps) {
  const { t } = useTranslation();
  const [toEvent, setToEvent] = useState<Event>();

  function handleEvent(event: Event, relayUrl?: string) {
    switch (event.kind) {
      case WellKnownEventKind.text_note:
        if (toEvent == null && event.id === eventId) {
          setToEvent(event);
        }
        break;

      default:
        break;
    }
  }

  useEffect(() => {
    worker.subMsgByEventIds([eventId])?.iterating({ cb: handleEvent });
  }, [eventId]);

  const read = async () => {
    const link = '/event/' + eventId;
    window.open(link, '__blank');
    const lastReadTime = get();
    if (msg.created_at > lastReadTime) {
      update(msg.created_at);
    }
  };

  return (
    <span
      style={{
        display: 'block',
        margin: '10px 0px',
        padding: '5px',
        borderBottom: '1px dashed rgb(221, 221, 221)',
        cursor: 'pointer',
      }}
      key={msg.id}
      onClick={read}
    >
      <span style={{ color: 'red' }}>
        <FavoriteIcon />
      </span>
      <span style={{ margin: '0px 5px' }}>
        <a href={'/user/' + msg.pubkey}>{userMap.get(msg.pubkey)?.name}</a>
      </span>
      {t('notification.likedYour')}
      <a href={'/event/' + eventId}>{t('notification.note')}</a>{' '}
      <span style={{}}>"{maxStrings(toEvent?.content || '', 30)}"</span>
    </span>
  );
}

export function ReplyItem({ msg, userMap, eventId, worker }: ItemProps) {
  const { t } = useTranslation();
  const [toEvent, setToEvent] = useState<Event>();

  function handleEvent(event: Event, relayUrl?: string) {
    switch (event.kind) {
      case WellKnownEventKind.text_note:
        if (toEvent == null && event.id === eventId) {
          setToEvent(event);
        }
        break;

      default:
        break;
    }
  }

  useEffect(() => {
    worker.subMsgByEventIds([eventId])?.iterating({ cb: handleEvent });
  }, [eventId]);
  const read = async () => {
    const link = '/event/' + eventId;
    window.open(link, '__blank');
    const lastReadTime = get();
    if (msg.created_at > lastReadTime) {
      update(msg.created_at);
    }
  };
  return (
    <span
      style={{
        display: 'block',
        margin: '10px 0px',
        padding: '5px',
        borderBottom: '1px dashed rgb(221, 221, 221)',
      }}
      key={msg.id}
    >
      <span style={{ marginBottom: '10px' }}>
        <ProfileAvatar
          picture={userMap.get(msg.pubkey)?.picture}
          name={userMap.get(msg.pubkey)?.name}
        />
        <span style={{ margin: '0px 5px' }}>
          <a href={'/user/' + msg.pubkey}>{userMap.get(msg.pubkey)?.name}</a>
        </span>
        <span style={{ fontSize: '12px', color: 'gray' }}>
          {eventId && (
            <span>
              {t('notification.replyToYour')}{' '}
              <a href={'/event/' + eventId}>{t('notification.note')}</a> "
              {maxStrings(toEvent?.content || '', 30)}"
            </span>
          )}
          {!eventId && <span>{t('notification.mentionYou')}</span>}
        </span>
        <a
          style={{ textDecoration: 'none', color: 'black' }}
          href={'#'}
          onClick={read}
        >
          <Content text={msg?.content} />
        </a>
      </span>
    </span>
  );
}

export function ArticleCommentItem({
  msg,
  userMap,
  eventId,
  worker,
}: ItemProps) {
  const { t } = useTranslation();
  const [toEvent, setToEvent] = useState<Event>();

  function handleEvent(event: Event, relayUrl?: string) {
    switch (event.kind) {
      case WellKnownEventKind.long_form:
        if (toEvent == null && event.id === eventId) {
          setToEvent(event);
        }
        break;

      default:
        break;
    }
  }
  useEffect(() => {
    worker.subMsgByEventIds([eventId])?.iterating({ cb: handleEvent });
  }, [eventId]);

  const read = async () => {
    if (toEvent == null) return;

    const article = Nip23.toArticle(toEvent);
    const link = '/post/' + toEvent.pubkey + '/' + article.id;
    window.open(link, '__blank');
    const lastReadTime = get();
    if (msg.created_at > lastReadTime) {
      update(msg.created_at);
    }
  };

  return (
    <span
      style={{
        display: 'block',
        margin: '10px 0px',
        padding: '5px',
        borderBottom: '1px dashed rgb(221, 221, 221)',
      }}
      key={msg.id}
    >
      <span style={{ marginBottom: '10px' }}>
        <ProfileAvatar
          picture={userMap.get(msg.pubkey)?.picture}
          name={userMap.get(msg.pubkey)?.name}
        />
        <span style={{ margin: '0px 5px' }}>
          <a href={'/user/' + msg.pubkey}>{userMap.get(msg.pubkey)?.name}</a>
        </span>
        <span style={{ fontSize: '12px', color: 'gray' }}>
          {toEvent?.kind === Nip23.kind && (
            <span>
              {' replying to your '}
              <a
                href={
                  '/post/' + toEvent?.pubkey + '/' + Nip23.toArticle(toEvent).id
                }
              >
                {'article'}
              </a>{' '}
              "{Nip23.toArticle(toEvent).title || ''}"
            </span>
          )}
          {!eventId && <span>{'reply to your article'}</span>}
        </span>
        <a
          style={{ textDecoration: 'none', color: 'black' }}
          href={'#'}
          onClick={read}
        >
          <Content text={msg?.content} />
        </a>
      </span>
    </span>
  );
}

export function Notification({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [textNotes, setTextNotes] = useState<Event[]>([]);
  const [articleNotes, setArticleNotes] = useState<Event[]>([]);
  const [msgList, setMsgList] = useState<Event[]>([]);
  const myPublicKey = useReadonlyMyPublicKey();

  const { worker, newConn } = useCallWorker();
  function handleEvent1(event: Event, relayUrl?: string) {
    console.log('handleEvent1: ', event.kind);
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

      default:
        if (
          event.kind !== WellKnownEventKind.text_note &&
          event.kind !== WellKnownEventKind.like
        )
          return;

        // if (event.pubkey === myPublicKey) return;

        setMsgList(oldArray => {
          if (!oldArray.map(e => e.id).includes(event.id)) {
            // do not add duplicated msg

            const newItems = [
              ...oldArray,
              { ...event, ...{ seen: [relayUrl!] } },
            ];
            // sort by timestamp
            const sortedItems = newItems.sort((a, b) =>
              a.created_at >= b.created_at ? -1 : 1,
            );
            return sortedItems;
          }

          return oldArray;
        });

        // check if need to sub new user metadata
        const newPks: string[] = [];
        for (const t of event.tags) {
          if (isEventPTag(t)) {
            const pk = t[1];
            if (userMap.get(pk) == null && !newPks.includes(pk)) {
              newPks.push(pk);
            }
          }
        }
        if (
          userMap.get(event.pubkey) == null &&
          !newPks.includes(event.pubkey)
        ) {
          newPks.push(event.pubkey);
        }

        if (newPks.length > 0) {
          worker?.subMetadata(newPks)?.iterating({ cb: handleEvent1 });
        }
        break;
    }
  }

  useEffect(() => {
    if (myPublicKey == null || myPublicKey.length === 0) return;
    if (newConn.length === 0) return;

    const lastReadTime = defaultLastNotifyTime;
    worker
      ?.subMsgByPTags({
        publicKeys: [myPublicKey],
        kinds: [WellKnownEventKind.text_note, WellKnownEventKind.like],
        since: lastReadTime,
        callRelay: {
          type: CallRelayType.batch,
          data: newConn,
        },
      })
      ?.iterating({ cb: handleEvent1 });
  }, [newConn, myPublicKey]);

  return (
    <BaseLayout>
      <Left>
        {msgList.length > 0 &&
          msgList
            .filter(m => m.pubkey !== myPublicKey) //todo: remove this after bug fix in the onMsgHandler
            .map(msg => {
              switch (msg.kind) {
                case WellKnownEventKind.like:
                  return (
                    <LikeItem
                      eventId={getNotifyToEventId(msg)!}
                      msg={msg}
                      userMap={userMap}
                      worker={worker!}
                      key={msg.id}
                    />
                  );

                case WellKnownEventKind.text_note:
                  const addr = getAddrTag(msg);
                  if (addr && addr.startsWith(Nip23.kind.toString())) {
                    const articleEvent = articleNotes.filter(
                      t => t.id === getNotifyToEventId(msg),
                    )[0];
                    return (
                      <ArticleCommentItem
                        eventId={getNotifyToEventId(msg)!}
                        msg={msg}
                        userMap={userMap}
                        worker={worker!}
                        key={msg.id}
                      />
                    );
                  } else {
                    const textEvent = textNotes.filter(
                      t => t.id === getNotifyToEventId(msg),
                    )[0];
                    return (
                      <ReplyItem
                        eventId={getNotifyToEventId(msg)!}
                        msg={msg}
                        userMap={userMap}
                        worker={worker!}
                        key={msg.id}
                      />
                    );
                  }

                default:
                  break;
              }
            })}

        {msgList.filter(m => m.pubkey !== myPublicKey).length === 0 && (
          <p>{'no data in last 24 hours'}</p>
        )}
      </Left>
      <Right></Right>
    </BaseLayout>
  );
}

export default connect(loginMapStateToProps)(Notification);

function getNotifyToEventId(msg: Event): string | null {
  return msg.tags.filter(t => t[0] === EventTags.E).map(t => t[1])[0];
}

function getAddrTag(msg: Event): string | null {
  return msg.tags.filter(t => t[0] === EventTags.A).map(t => t[1])[0];
}
