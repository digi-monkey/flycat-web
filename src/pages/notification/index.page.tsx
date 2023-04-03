import { Nip23 } from 'service/nip/23';
import { Paths } from 'constants/path';
import { connect } from 'react-redux';
import { UserMap } from 'service/type';
import { Content } from 'components/layout/msg/content';
import { useRouter } from 'next/router';
import { maxStrings } from 'service/helper';
import { CallWorker } from 'service/worker/callWorker';
import { CallRelayType } from 'service/worker/type';
import { ProfileAvatar } from 'components/layout/msg/TextMsg';
import { useCallWorker } from 'hooks/useWorker';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import { loginMapStateToProps } from 'pages/helper';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { BaseLayout, Left, Right } from 'components/layout/BaseLayout';
import { defaultLastNotifyTime, get, update } from 'service/last-notify';
import {
  deserializeMetadata,
  Event,
  EventSetMetadataContent,
  EventTags,
  WellKnownEventKind,
} from 'service/api';

import Link from 'next/link';
import FavoriteIcon from '@mui/icons-material/Favorite';

export interface ItemProps {
  msg: Event;
  eventId: string;
  userMap: UserMap;
  worker: CallWorker;
}

export function LikeItem({ msg, eventId, userMap, worker }: ItemProps) {
  const { t } = useTranslation();
  const [toEvent, setToEvent] = useState<Event>();
  const router = useRouter();

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
    router.push({
      pathname: `${Paths.event}/${eventId}`
    });
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
        <Link href={Paths.user + msg.pubkey}>{userMap.get(msg.pubkey)?.name}</Link>
      </span>
      {t('notification.likedYour')}
      <Link href={`${Paths.event}/${eventId}`}>{t('notification.note')}</Link>{' '}
      <span style={{}}>&quot;{maxStrings(toEvent?.content || '', 30)}&quot;</span>
    </span>
  );
}

export function ReplyItem({ msg, userMap, eventId, worker }: ItemProps) {
  const { t } = useTranslation();
  const router = useRouter();
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
    router.push({
      pathname: `${Paths.event}/${eventId}`
    });
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
          <Link href={Paths.user + msg.pubkey}>{userMap.get(msg.pubkey)?.name}</Link>
        </span>
        <span style={{ fontSize: '12px', color: 'gray' }}>
          {eventId && (
            <span>
              {t('notification.replyToYour')}{' '}
              <Link href={`${Paths.event}/${eventId}`}>{t('notification.note')}</Link> &quot;
              {maxStrings(toEvent?.content || '', 30)}&quot;
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
  const router = useRouter();
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
    const lastReadTime = get();
    if (msg.created_at > lastReadTime) update(msg.created_at);

    router.push({
      pathname: `${Paths.post + toEvent.pubkey}/${encodeURIComponent(article.id)}`
    });
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
          <Link href={Paths.user + msg.pubkey}>{userMap.get(msg.pubkey)?.name}</Link>
        </span>
        <span style={{ fontSize: '12px', color: 'gray' }}>
          {toEvent?.kind === Nip23.kind && (
            <span>
              {' replying to your '}
              <Link href={`${Paths.post + toEvent?.pubkey}/${encodeURIComponent(Nip23.toArticle(toEvent).id)}`}>
                {'article'}
              </Link>{' '}
              &quot;{Nip23.toArticle(toEvent).title || ''}&quot;
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
  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn } = useCallWorker();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [msgList, setMsgList] = useState<Event[]>([]);

  function handleEvent(event: Event, relayUrl?: string) {
    console.log('handleEvent: ', event.kind);
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

            // check if need to sub new user metadata
            const newPks: string[] = [];
            if (
              userMap.get(event.pubkey) == null &&
              !newPks.includes(event.pubkey)
            ) {
              newPks.push(event.pubkey);
            }

            if (newPks.length > 0) {
              worker
                ?.subMetadata(newPks, undefined, undefined, {
                  type: CallRelayType.single,
                  data: [relayUrl!],
                })
                ?.iterating({ cb: handleEvent });
            }
            return sortedItems;
          }

          return oldArray;
        });

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
      ?.iterating({ cb: handleEvent });
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

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
})

function getNotifyToEventId(msg: Event): string | null {
  return msg.tags.filter(t => t[0] === EventTags.E).map(t => t[1])[0];
}

function getAddrTag(msg: Event): string | null {
  return msg.tags.filter(t => t[0] === EventTags.A).map(t => t[1])[0];
}
