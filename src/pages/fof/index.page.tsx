import { Paths } from 'constants/path';
import { connect } from 'react-redux';
import { UserMap } from 'service/type';
import { useTheme } from '@mui/material';
import { CallRelayType } from 'service/worker/type';
import { ProfileAvatar } from 'components/layout/msg/TextMsg';
import { useCallWorker } from 'hooks/useWorker';
import { EventWithSeen } from 'pages/type';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import { loginMapStateToProps } from 'pages/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/layout/BaseLayout';
import {
  WellKnownEventKind,
  Event,
  EventSetMetadataContent,
  deserializeMetadata,
  EventTags,
} from 'service/api';

import Link from 'next/link';

export function FriendOfFriend({ isLoggedIn }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const myPublicKey = useReadonlyMyPublicKey();

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [contactEvents, setContactEvents] = useState<EventWithSeen[]>([]);
  const [myContactEvent, setMyContactEvent] = useState<Event>();
  const [isFetchAllContactEvent, setIsFetchAllContactEvent] =
    useState<boolean>(false);
  const [pks, setPks] = useState<string[]>([]);

  const { worker, newConn } = useCallWorker();

  // Total events we want to render in the activity list
  const contactEventLimits = 5;
  const maxPks = 150;

  function handleEvent(event: Event, relayUrl?: string) {
    console.debug(`[${worker?._workerId}]receive event`);

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

  useEffect(() => {
    if (newConn.length === 0) return;
    if (myPublicKey == null || myPublicKey.length === 0) return;

    const filter = {
      authors: [myPublicKey],
      kinds: [WellKnownEventKind.contact_list],
      limit: 1,
    };
    const sub = worker?.subFilter(filter, undefined, undefined, {
      type: CallRelayType.batch,
      data: newConn,
    });
    sub?.iterating({ cb: handleEvent });
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
    worker
      ?.subFilter(filter, undefined, 'getFof', {
        type: CallRelayType.batch,
        data: newConn,
      })
      ?.iterating({ cb: handleEvent });
  }, [myContactEvent, newConn]);

  useEffect(() => {
    if (isFetchAllContactEvent === false) return;
    if (myContactEvent == null) return;

    const myFollowingPks = getPksFromContact(myContactEvent);
    const arr = contactEvents.map(e => getPksFromContact(e));
    const pks: string[] = Array.from(new Set(arr.flat()))
      .filter(pk => !myFollowingPks.includes(pk) && pk !== myPublicKey)
      .filter(p => userMap.get(p) == null);
    const sub = worker?.subMetadata(pks);
    sub?.iterating({ cb: handleEvent });
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
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ textTransform: 'capitalize' }}>{t('fof.title')}</h3>
            <ThinHr />
            <div style={{ margin: '10px' }}>
              {pks.map(pk => (
                <span
                  style={{
                    width: '120px',
                    height: '200px',
                    overflow: 'scroll',
                    margin: '5px',
                    display: 'inline-block',
                    textAlign: 'center',
                    padding: '5px',
                    border: '1px solid ' + theme.palette.secondary.main,
                  }}
                >
                  <Link href={Paths.user + pk}>
                    <ProfileAvatar
                      picture={userMap.get(pk)?.picture}
                      name={pk}
                    />
                    <span style={{ display: 'block' }}>
                      {userMap.get(pk)?.name || '__'}
                    </span>
                  </Link>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      textAlign: 'left',
                      color: 'gray',
                      padding: '0px 10px',
                    }}
                  >
                    {userMap.get(pk)?.about || 'no self description'}
                  </span>
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

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
})

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
