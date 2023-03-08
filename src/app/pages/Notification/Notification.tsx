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
  userMap: UserMap;
  event: Event;
  eventId: string;
  worker: CallWorker;
  iteratorCallBack: (event: Event, relayUrl?: string) => any;
}

export function LikeItem({
  msg,
  userMap,
  eventId,
  event,
  worker,
  iteratorCallBack,
}: ItemProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (event == null) {
      worker.subMsgByEventIds([eventId])?.iterating({ cb: iteratorCallBack });
    }
  }, [event, worker]);

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
      <a href={'/event/' + event?.id}>{t('notification.note')}</a>{' '}
      <span style={{}}>"{maxStrings(event?.content || '', 30)}"</span>
    </span>
  );
}

export function ReplyItem({
  msg,
  userMap,
  event,
  eventId,
  worker,
  iteratorCallBack,
}: ItemProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (event == null) {
      worker.subMsgByEventIds([eventId])?.iterating({ cb: iteratorCallBack });
    }
  }, [event, worker]);
  const read = async () => {
    const link = '/event/' + (event?.id || msg.id);
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
          {event?.id && (
            <span>
              {t('notification.replyToYour')}{' '}
              <a href={'/event/' + event?.id}>{t('notification.note')}</a> "
              {maxStrings(event?.content || '', 30)}"
            </span>
          )}
          {!event?.id && <span>{t('notification.mentionYou')}</span>}
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
  event,
  eventId,
  worker,
  iteratorCallBack,
}: ItemProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (event == null) {
      worker.subMsgByEventIds([eventId])?.iterating({ cb: iteratorCallBack });
    }
  }, [event, worker]);
  const read = async () => {
    const article = Nip23.toArticle(event);
    const link = '/post/' + event.pubkey + '/' + article.id;
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
          {event?.kind === Nip23.kind && (
            <span>
              {' replying to your '}
              <a
                href={'/post/' + event.pubkey + '/' + Nip23.toArticle(event).id}
              >
                {'article'}
              </a>{' '}
              "{Nip23.toArticle(event).title || ''}"
            </span>
          )}
          {!event?.id && <span>{'reply to your article'}</span>}
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

  const updateWorkerMsgListenerDeps = [];
  const { worker, newConn } = useCallWorker();
  const { worker: worker2, newConn: newConn2 } = useCallWorker();

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

  function handleEvent2(event: Event, relayUrl?: string) {
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

      case WellKnownEventKind.text_note:
        if (event.pubkey === myPublicKey) return;
        setTextNotes(oldArray => {
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
        break;

      case WellKnownEventKind.long_form:
        if (event.pubkey === myPublicKey) return;
        setArticleNotes(oldArray => {
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
        break;

      default:
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
                      event={
                        textNotes.filter(
                          t => t.id === getNotifyToEventId(msg),
                        )[0]
                      }
                      eventId={getNotifyToEventId(msg)!}
                      msg={msg}
                      userMap={userMap}
                      worker={worker2!}
                      key={msg.id}
                      iteratorCallBack={handleEvent2}
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
                        event={articleEvent}
                        eventId={getNotifyToEventId(msg)!}
                        msg={msg}
                        userMap={userMap}
                        worker={worker2!}
                        key={msg.id}
                        iteratorCallBack={handleEvent2}
                      />
                    );
                  } else {
                    const textEvent = textNotes.filter(
                      t => t.id === getNotifyToEventId(msg),
                    )[0];
                    return (
                      <ReplyItem
                        event={textEvent}
                        eventId={getNotifyToEventId(msg)!}
                        msg={msg}
                        userMap={userMap}
                        worker={worker2!}
                        key={msg.id}
                        iteratorCallBack={handleEvent2}
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
