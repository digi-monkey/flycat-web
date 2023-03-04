import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import { Msgs } from 'app/components/layout/msg/Msg';
import RelayManager from 'app/components/layout/relay/RelayManager';
import { loginMapStateToProps } from 'app/helper';
import { EventWithSeen } from 'app/type';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useSelector } from 'react-redux';
import {
  EventSubResponse,
  isEventSubResponse,
  WellKnownEventKind,
  Event,
  EventSetMetadataContent,
  deserializeMetadata,
  EventTags,
  EventContactListPTag,
} from 'service/api';
import { isValidWssUrl } from 'service/helper';
import { defaultRelays } from 'service/relay';
import { UserMap } from 'service/type';
import { CallRelayType, FromWorkerMessageData } from 'service/worker/type';
import { RootState } from 'store/configureStore';
import styled from 'styled-components';
import SimpleSelect from '../../components/inputs/Select';
import PublicIcon from '@mui/icons-material/Public';
import { ProfileAvatar, ProfileName } from 'app/components/layout/msg/TextMsg';

const styles = {
  label: { color: 'gray', fontSize: '14px' },
  section: { marginBottom: '40px' },
};

const LightBtn = styled.button`
  border: none;
  color: white;
  background: rgb(141, 197, 63);
  margin-left: 10px;
  :hover {
    color: black;
    background: white;
    border: 1px solid rgb(141, 197, 63);
  }
`;

export function FriendOfFriend({ isLoggedIn }) {
  const { t } = useTranslation();
  const myPublicKey = useReadonlyMyPublicKey();

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [contactEvents, setContactEvents] = useState<EventWithSeen[]>([]);
  const [myContactEvent, setMyContactEvent] = useState<Event>();
  const [isFetchAllContactEvent, setIsFetchAllContactEvent] =
    useState<boolean>(false);
  const [pks, setPks] = useState<string[]>([]);

  const { worker, newConn } = useCallWorker({
    onMsgHandler,
    updateWorkerMsgListenerDeps: [userMap.size, myPublicKey, userMap],
  });

  // Total events we want to render in the activity list
  const contactEventLimits = 5;
  const maxPks = 150;

  function onMsgHandler(this, data: any, relayUrl?: string) {
    const msg = JSON.parse(data);
    if (isEventSubResponse(msg)) {
      const event = msg[2];

      if (event.kind === WellKnownEventKind.set_metadata) {
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
        return;
      }

      if (event.kind === WellKnownEventKind.contact_list) {
        if (event.pubkey === myPublicKey) {
          setMyContactEvent(prev => {
            if (prev && prev?.created_at >= event.created_at) {
              return prev;
            }

            return event;
          });
        } else {
          setContactEvents(oldArray => {
            if (
              oldArray.length > contactEventLimits &&
              oldArray[oldArray.length - 1].created_at > event.created_at
            ) {
              return oldArray;
            }

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
              // cut to max size
              if (sortedItems.length > contactEventLimits) {
                return sortedItems.slice(0, contactEventLimits + 1);
              }
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
      }
    }
  }

  useEffect(() => {
    if (newConn.length === 0) return;
    if (myPublicKey == null || myPublicKey.length === 0) return;

    const filter = {
      authors: [myPublicKey],
      kinds: [WellKnownEventKind.contact_list],
      limit: 1,
    };
    worker?.subFilter(filter, undefined, undefined, {
      type: CallRelayType.batch,
      data: newConn,
    });
  }, [myPublicKey, newConn]);

  useEffect(() => {
    if (isFetchAllContactEvent === true) return;
    if (myContactEvent == null) return;

    const filter = {
      authors: getRandomPks(
        getPksFromContact(myContactEvent),
        contactEventLimits,
      ),
      kinds: [WellKnownEventKind.contact_list],
    };
    worker?.subFilter(filter);
  }, [myContactEvent]);

  useEffect(() => {
    if (isFetchAllContactEvent === false) return;
    if (myContactEvent == null) return;

    const myFollowingPks = getPksFromContact(myContactEvent);
    const arr = contactEvents.map(e => getPksFromContact(e));
    const pks: string[] = Array.from(new Set(arr.flat()))
      .filter(pk => !myFollowingPks.includes(pk) && pk !== myPublicKey)
      .filter(p => userMap.get(p) == null);
    worker?.subMetadata(pks);
    console.log(pks.length, worker == null);
  }, [isFetchAllContactEvent]);

  useEffect(() => {
    if (contactEvents.length > contactEventLimits) {
      setIsFetchAllContactEvent(true);
    }
  }, [contactEvents.length]);

  useEffect(() => {
    if (myContactEvent == null) return;

    const myFollowingPks = getPksFromContact(myContactEvent);
    setPks(prev => {
      const arr = contactEvents.map(e => getPksFromContact(e));
      const newItems: string[] = Array.from(new Set(arr.flat())).filter(
        pk => !myFollowingPks.includes(pk),
      );

      const data = prev;
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        if (!prev.includes(item)) {
          data.push(item);
        }
      }
      return data.slice(0, maxPks);
    });
  }, [contactEvents]);

  return (
    <BaseLayout>
      <Left>
        <div>
          <div style={styles.section}>
            <h3 style={{ textTransform: 'capitalize' }}>{t('fof.title')}</h3>
            <ThinHr />
            <div style={{ margin: '10px' }}>
              {pks.map(pk => (
                <span
                  style={{
                    width: '80px',
                    height: '100px',
                    overflow: 'scroll',
                    margin: '5px',
                    display: 'inline-block',
                    textAlign: 'center',
                  }}
                >
                  <a href={'/user/' + pk}>
                    <ProfileAvatar
                      picture={userMap.get(pk)?.picture}
                      name={pk}
                    />
                    <span style={{ display: 'block' }}>
                      {userMap.get(pk)?.name || '__'}
                    </span>
                  </a>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
}

export default connect(loginMapStateToProps)(FriendOfFriend);

function ThinHr() {
  return <div style={{ borderBottom: '1px solid #f1eded' }} />;
}

function getPksFromContact(event: Event) {
  if (event.kind !== WellKnownEventKind.contact_list)
    throw new Error('invalid event kind for contact list');

  const pks = event.tags.filter(t => t[0] === EventTags.P).map(t => t[1]);
  return pks;
}

function getRandomPks(strings: string[], num: number): string[] {
  const result: string[] = [];
  while (result.length < num) {
    const randomIndex = Math.floor(Math.random() * strings.length);
    const randomString = strings[randomIndex];
    if (!result.includes(randomString)) {
      result.push(randomString);
    }
  }
  return result;
}
