import { loginMapStateToProps } from '../../helper';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import { useTranslation } from 'react-i18next';
import RelayManager from 'app/components/layout/relay/RelayManager';
import { UserBox, UserRequiredLoginBox } from 'app/components/layout/UserBox';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { UserMap } from 'service/type';
import { defaultLastNotifyTime, get, update } from 'service/last-notify';
import {
  deserializeMetadata,
  Event,
  EventSetMetadataContent,
  EventSubResponse,
  EventTags,
  Filter,
  isEventPTag,
  isEventSubResponse,
  WellKnownEventKind,
} from 'service/api';
import { CallRelayType } from 'service/worker/type';
import { useNotes } from 'hooks/useNotes';
import { ProfileAvatar, TextMsg } from 'app/components/layout/msg/TextMsg';
import { maxStrings } from 'service/helper';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { CallWorker } from 'service/worker/callWorker';
import { Content } from 'app/components/layout/msg/Content';

export interface ItemProps {
  msg: Event;
  userMap: UserMap;
  event: Event;
  eventId: string;
  worker: CallWorker;
}

export function LikeItem({ msg, userMap, eventId, event, worker }: ItemProps) {
  useEffect(() => {
    if (event == null) {
      worker.subMsgByEventIds([eventId]);
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
      liked your <a href={'/event/' + event?.id}>note</a>{' '}
      <span style={{}}>"{maxStrings(event?.content || '', 30)}"</span>
    </span>
  );
}

export function ReplyItem({ msg, userMap, event, worker }: ItemProps) {
  useEffect(() => {
    if (event == null) {
      worker.subMsgByEventIds([msg.id]);
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
              replying to your <a href={'/event/' + event?.id}>note</a> "
              {maxStrings(event?.content || '', 30)}"
            </span>
          )}
          {!event?.id && <span>mentioned you</span>}
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
  const { t } = useTranslation();

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [textNotes, setTextNotes] = useState<Event[]>([]);
  const [msgList, setMsgList] = useState<Event[]>([]);
  const myPublicKey = useReadonlyMyPublicKey();

  const updateWorkerMsgListenerDeps = [myPublicKey, userMap.size];
  const { worker, newConn } = useCallWorker({
    onMsgHandler,
    updateWorkerMsgListenerDeps,
  });

  const { worker: worker2, newConn: newConn2 } = useCallWorker({
    onMsgHandler: onMsgHandler2,
    updateWorkerMsgListenerDeps: [userMap.size],
  });

  function onMsgHandler(nostrData: any, relayUrl?: string) {
    const msg = JSON.parse(nostrData);
    if (isEventSubResponse(msg)) {
      const event = (msg as EventSubResponse)[2];
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

        case WellKnownEventKind.contact_list:
          // do nothing
          break;

        default:
          if (
            event.kind !== WellKnownEventKind.text_note &&
            event.kind !== WellKnownEventKind.like
          )
            return;

          if (event.pubkey === myPublicKey) return;

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
            worker?.subMetadata(newPks);
          }
          break;
      }
    }
  }

  function onMsgHandler2(nostrData: any, relayUrl?: string) {
    const msg = JSON.parse(nostrData);
    if (isEventSubResponse(msg)) {
      const event = (msg as EventSubResponse)[2];
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

        case WellKnownEventKind.contact_list:
          // do nothing
          break;

        default:
          if (event.kind !== WellKnownEventKind.text_note) return;
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

          /*
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
            worker2?.subMetadata(newPks);
          }
	  */

          break;
      }
    }
  }

  useEffect(() => {
    if (myPublicKey == null || myPublicKey.length === 0) return;
    if (newConn.length === 0) return;

    const lastReadTime = defaultLastNotifyTime;
    worker?.subMsgByPTags({
      publicKeys: [myPublicKey],
      since: lastReadTime,
      callRelay: {
        type: CallRelayType.batch,
        data: newConn,
      },
    });
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
                    />
                  );

                case WellKnownEventKind.text_note:
                  return (
                    <ReplyItem
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
                    />
                  );

                default:
                  break;
              }
            })}
      </Left>
      <Right>
        {isLoggedIn && (
          <UserBox
            pk={myPublicKey}
            avatar={userMap.get(myPublicKey)?.picture}
            name={userMap.get(myPublicKey)?.name}
            about={userMap.get(myPublicKey)?.about}
          />
        )}
        {!isLoggedIn && <UserRequiredLoginBox />}
        <hr />
        <RelayManager />
      </Right>
    </BaseLayout>
  );
}

export default connect(loginMapStateToProps)(Notification);

function getNotifyToEventId(msg: Event): string | null {
  return msg.tags.filter(t => t[0] === EventTags.E).map(t => t[1])[0];
}
