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
import { get } from 'service/last-notify';
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

export interface Likes {
  publicKeys: string[];
  eventId: string;
}

export interface ItemProps {
  msg: Event;
  userMap: UserMap;
  event: Event;
}

export function LikeItem({ msg, userMap, event }: ItemProps) {
  return (
    <span
      style={{
        display: 'block',
        margin: '10px 0px',
        padding: '5px',
        background: '#F4F5F4',
      }}
      key={msg.id}
    >
      <span style={{ color: 'red' }}>
        <FavoriteIcon />
      </span>
      <span style={{ margin: '0px 5px' }}>
        <a href={'/user/' + msg.pubkey}>{userMap.get(msg.pubkey)?.name}</a>
      </span>
      liked your <a href={'/event/' + msg.id}>note</a>{' '}
      <span style={{}}>"{maxStrings(event?.content || '', 30)}"</span>
    </span>
  );
}

export function ReplyItem({ msg, userMap, event }: ItemProps) {
  return (
    <span
      style={{
        display: 'block',
        margin: '10px 0px',
        padding: '5px',
        background: '#F4F5F4',
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
          replying to your <a href={'/event/' + msg.id}>note</a> "
          {maxStrings(event?.content || '', 30)}"
        </span>
        <a
          style={{ textDecoration: 'none', color: 'black' }}
          href={'/event/' + msg.id}
        >
          <Content text={msg?.content} />
        </a>
      </span>
    </span>
  );
}

function getNotifyToEventId(msg: Event): string | null {
  return msg.tags.filter(t => t[0] === EventTags.E).map(t => t[1])[0];
}

export function Notification({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { t } = useTranslation();

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [textNotes, setTextNotes] = useState<Event[]>([]);
  const [msgList, setMsgList] = useState<Event[]>([]);
  const [likes, setLikes] = useState<{}>([]);
  const myPublicKey = useReadonlyMyPublicKey();
  const updateWorkerMsgListenerDeps = [myPublicKey];
  const { worker, newConn, wsConnectStatus } = useCallWorker({
    onMsgHandler,
    updateWorkerMsgListenerDeps,
  });

  const filter: Filter = {
    ids: msgList.map(m => getNotifyToEventId(m)!),
  };
  const notes = useNotes(filter, []);

  useEffect(() => {
    setTextNotes(notes);
  }, [notes]);

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

  useEffect(() => {
    if (myPublicKey == null || myPublicKey.length === 0) return;

    const lastReadTime = get();
    worker?.subMsgByPTags({
      publicKeys: [myPublicKey],
      since: lastReadTime,
      callRelay: {
        type: CallRelayType.batch,
        data: newConn,
      },
    });
  }, [worker, newConn, myPublicKey]);

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
                      msg={msg}
                      userMap={userMap}
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
                      msg={msg}
                      userMap={userMap}
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
