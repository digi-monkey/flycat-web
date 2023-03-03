import React, { useState, useEffect, useMemo } from 'react';
import {
  Event,
  EventSubResponse,
  EventSetMetadataContent,
  isEventSubResponse,
  WellKnownEventKind,
  PublicKey,
  RelayUrl,
  PetName,
  isEventETag,
  isEventPTag,
  EventId,
  EventTags,
  deserializeMetadata,
} from 'service/api';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import { UserMap } from 'service/type';
import { useTranslation } from 'react-i18next';
import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import { loginMapStateToProps } from 'app/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { Msgs } from 'app/components/layout/msg/Msg';
import { EventWithSeen } from 'app/type';
import { ThinHr } from 'app/components/layout/ThinHr';

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
  myAvatar: {
    width: '48px',
    height: '48px',
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
  userProfile: {
    padding: '10px',
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
  eventId: EventId;
}

export const EventPage = ({ isLoggedIn }) => {
  const { t } = useTranslation();
  const { eventId } = useParams<UserParams>();

  const myPublicKey = useReadonlyMyPublicKey();
  const updateWorkerMsgListenerDeps = [myPublicKey, isLoggedIn];
  const { worker, newConn, wsConnectStatus } = useCallWorker({
    onMsgHandler,
    updateWorkerMsgListenerDeps,
  });

  const [unknownPks, setUnknownPks] = useState<PublicKey[]>([]);
  const [msgList, setMsgList] = useState<EventWithSeen[]>([]);
  const [userMap, setUserMap] = useState<UserMap>(new Map());

  function onMsgHandler(data: any, relayUrl?: string) {
    const msg = JSON.parse(data);
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

        case WellKnownEventKind.text_note:
          {
            setMsgList(oldArray => {
              const replyToEventIds = oldArray
                .map(e => getEventIdsFromETags(e.tags))
                .reduce((prev, current) => prev.concat(current), []);
              const eTags = getEventIdsFromETags(event.tags);
              if (
                !oldArray.map(e => e.id).includes(event.id) &&
                (replyToEventIds.includes(event.id) ||
                  eTags.includes(eventId) ||
                  event.id === eventId)
              ) {
                // only add un-duplicated and replyTo msg
                const newItems = [
                  ...oldArray,
                  { ...event, ...{ seen: [relayUrl!] } },
                ];
                // sort by timestamp in asc
                const sortedItems = newItems.sort((a, b) =>
                  a.created_at >= b.created_at ? 1 : -1,
                );
                return sortedItems;
              } else {
                const id = oldArray.findIndex(s => s.id === event.id);
                if (id === -1) return oldArray;

                if (!oldArray[id].seen?.includes(relayUrl!)) {
                  oldArray[id].seen?.push(relayUrl!);
                }
              }
              return oldArray;
            });
          }

          // check if need to sub new user metadata
          const newPks: PublicKey[] = [];
          for (const t of event.tags) {
            if (isEventPTag(t)) {
              const pk = t[1];
              if (userMap.get(pk) == null && !unknownPks.includes(pk)) {
                newPks.push(pk);
              }
            }
          }
          if (
            userMap.get(event.pubkey) == null &&
            !unknownPks.includes(event.pubkey)
          ) {
            newPks.push(event.pubkey);
          }
          if (newPks.length > 0) {
            setUnknownPks([...unknownPks, ...newPks]);
          }
          break;

        default:
          break;
      }
    }
  }

  useEffect(() => {
    worker?.subMsgByEventIds([eventId]);
    worker?.subMsgByETags([eventId]);
  }, [newConn]);

  useEffect(() => {
    if (myPublicKey.length > 0) {
      worker?.subMetadata([myPublicKey]);
    }
  }, [myPublicKey, newConn]);

  useEffect(() => {
    if (unknownPks.length > 0) {
      worker?.subMetadata(unknownPks);
    }
  }, [unknownPks, newConn]);

  useEffect(() => {
    const replyToEventIds = msgList
      .map(e => getEventIdsFromETags(e.tags))
      .reduce((prev, current) => prev.concat(current), []);
    const msgIds = msgList.map(m => m.id);

    // subscribe new reply event id
    const newIds: EventId[] = [];
    for (const id of replyToEventIds) {
      if (!msgIds.includes(id)) {
        newIds.push(id);
      }
    }
    if (newIds.length > 0) {
      worker?.subMsgByEventIds(newIds);
    }
  }, [newConn, msgList.length]);

  useEffect(() => {
    const msgIds = msgList.map(e => e.id);
    if (msgIds.length > 0) {
      worker?.subMsgByETags(msgIds);
    }
  }, [msgList.length]);

  const getEventIdsFromETags = (tags: any[]) => {
    const eventIds = tags.filter(t => isEventETag(t)).map(t => t[1] as EventId);
    return eventIds;
  };

  const relayUrls = Array.from(wsConnectStatus.keys());

  return (
    <BaseLayout>
      <Left>
        <div style={styles.message}>
          <h3>{t('thread.title')}</h3>
          <ThinHr></ThinHr>
          <ul style={styles.msgsUl}>
            {msgList.length > 0 && Msgs(msgList, worker!, userMap, relayUrls)}
          </ul>
        </div>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(EventPage);
