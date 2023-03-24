import { Msgs } from 'components/layout/msg/Msg';
import { Paths } from 'constants/path';
import { UserMap } from 'service/type';
import { connect } from 'react-redux';
import { useRouter } from 'next/router';
import { BlogFeeds } from '../blog/Feed';
import { LoginFormTip } from 'components/layout/NavHeader';
import { EventWithSeen } from 'pages/type';
import { CallRelayType } from 'service/worker/type';
import { useCallWorker } from 'hooks/useWorker';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useTranslation } from 'next-i18next';
import { PubNoteTextarea } from 'components/layout/PubNoteTextarea';
import { Button, useTheme } from '@mui/material';
import { useState, useEffect } from 'react';
import { loginMapStateToProps } from 'pages/helper';
import { LoginMode, SignEvent } from 'store/loginReducer';
import { BaseLayout, Left, Right } from 'components/layout/BaseLayout';
import {
  Event,
  EventSetMetadataContent,
  WellKnownEventKind,
  PublicKey,
  RelayUrl,
  PetName,
  EventTags,
  EventContactListPTag,
  RawEvent,
  isEventPTag,
  Filter,
  deserializeMetadata,
} from 'service/api';

import styles from './index.module.scss';
import BasicTabs from 'components/layout/SimpleTabs';
import CreateIcon from '@mui/icons-material/Create';
import PublicIcon from '@mui/icons-material/Public';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

export type ContactList = Map<
  PublicKey,
  {
    relayer: RelayUrl;
    name: PetName;
  }
>;

export interface HomePageProps {
  isLoggedIn: boolean;
  mode?: LoginMode;
  signEvent?: SignEvent;
}

const HomePage = ({ isLoggedIn, mode, signEvent }: HomePageProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const maxMsgLength = 50;
  const [globalMsgList, setGlobalMsgList] = useState<Event[]>([]);
  const [msgList, setMsgList] = useState<EventWithSeen[]>([]);
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactList, setMyContactList] =
    useState<{ keys: PublicKey[]; created_at: number }>();

  const myPublicKey = useMyPublicKey();
  const { worker, newConn, wsConnectStatus } = useCallWorker({});

  const isReadonlyMode = isLoggedIn && signEvent == null;

  const relayUrls = Array.from(wsConnectStatus.keys());

  function handleEvent(event: Event, relayUrl?: string) {
    console.debug(`[${worker?._workerId}]receive event`, relayUrl, event.kind);
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
        if (!isLoggedIn) {
          setGlobalMsgList(oldArray => {
            if (!oldArray.map(e => e.id).includes(event.id)) {
              // do not add duplicated msg
              const newItems = [...oldArray, event];
              // sort by timestamp
              const sortedItems = newItems.sort((a, b) =>
                a.created_at >= b.created_at ? -1 : 1,
              );

              // check if need to sub new user metadata
              const newPks: string[] = [event.pubkey];
              for (const t of event.tags) {
                if (isEventPTag(t)) {
                  const pk = t[1];
                  if (userMap.get(pk) == null) {
                    newPks.push(pk);
                  }
                }
              }
              if (newPks.length > 0) {
                const sub = worker?.subMetadata(newPks, false, 'homeMetadata', {
                  type: CallRelayType.single,
                  data: [relayUrl!],
                });
                sub?.iterating({ cb: handleEvent });
              }

              return sortedItems;
            }
            return oldArray;
          });

          return;
        }

        setMsgList(oldArray => {
          if (
            oldArray.length > maxMsgLength &&
            oldArray[oldArray.length - 1].created_at > event.created_at
          ) {
            return oldArray;
          }

          if (!oldArray.map(e => e.id).includes(event.id)) {
            // do not add duplicated msg

            // check if need to sub new user metadata
            const newPks: string[] = [];
            for (const t of event.tags) {
              if (isEventPTag(t)) {
                const pk = t[1];
                if (userMap.get(pk) == null) {
                  newPks.push(pk);
                }
              }
            }
            if (newPks.length > 0) {
              const sub = worker?.subMetadata(newPks, false, undefined, {
                type: CallRelayType.single,
                data: [relayUrl!],
              });
              sub?.iterating({ cb: handleEvent });
            }

            // save event
            const newItems = [
              ...oldArray,
              { ...event, ...{ seen: [relayUrl!] } },
            ];
            // sort by timestamp
            const sortedItems = newItems.sort((a, b) =>
              a.created_at >= b.created_at ? -1 : 1,
            );
            // cut to max size
            if (sortedItems.length > maxMsgLength) {
              return sortedItems.slice(0, maxMsgLength + 1);
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

        break;

      case WellKnownEventKind.contact_list:
        if (event.pubkey === myPublicKey) {
          setMyContactList(prev => {
            if (prev && prev?.created_at >= event.created_at) {
              return prev;
            }

            const keys = (
              event.tags.filter(
                t => t[0] === EventTags.P,
              ) as EventContactListPTag[]
            ).map(t => t[1]);
            return {
              keys,
              created_at: event.created_at,
            };
          });
        }
        break;

      default:
        break;
    }
  }

  useEffect(() => {
    if (isLoggedIn !== true) return;
    if (!myPublicKey || myPublicKey.length === 0) return;

    subMetadataAndContactList();
  }, [myPublicKey, newConn]);

  function subMetadataAndContactList() {
    const callRelay =
      newConn.length === 0
        ? { type: CallRelayType.all, data: [] }
        : { type: CallRelayType.batch, data: newConn };
    const sub = worker?.subMetaDataAndContactList([myPublicKey], false, 'userMetaAndContact', callRelay);
    sub?.iterating({
      cb: handleEvent,
    });
  }

  useEffect(() => {
    if (!myContactList || myContactList?.keys?.length === 0) return;

    const pks = myContactList.keys;
    // subscribe myself msg too
    if (myPublicKey && !pks.includes(myPublicKey) && myPublicKey.length > 0) {
      pks.push(myPublicKey);
    }

    if (pks.length > 0 && newConn.length > 0) {
      const callRelay = {
        type: CallRelayType.batch,
        data: newConn,
      };
      const subMetadata = worker?.subMetadata(
        pks,
        false,
        'homeMetadata',
        callRelay,
      );
      subMetadata?.iterating({
        cb: handleEvent,
      });

      const subMsg = worker?.subMsg(pks, true, 'homeMsg', callRelay);
      subMsg?.iterating({
        cb: handleEvent,
      });
    }
  }, [myContactList?.created_at, newConn]);

  useEffect(() => {
    if (isLoggedIn) return;
    if (newConn.length === 0) return;

    // global feed
    const filter: Filter = {
      kinds: [WellKnownEventKind.text_note],
      limit: 50,
    };
    const sub = worker?.subFilter(filter, undefined, undefined, {
      type: CallRelayType.batch,
      data: newConn,
    });
    sub?.iterating({
      cb: handleEvent,
    });
  }, [isLoggedIn, newConn]);

  const onSubmitText = async (text: string) => {
    if (signEvent == null) {
      return alert('no sign method!');
    }

    const rawEvent = new RawEvent(
      myPublicKey,
      WellKnownEventKind.text_note,
      undefined,
      text,
    );
    const event = await signEvent(rawEvent);
    console.log(text, event);

    // publish to all connected relays
    worker?.pubEvent(event);
  };

  const tabItems = {
    note: (
      <>
        <PubNoteTextarea
          mode={mode || {} as LoginMode}
          disabled={isReadonlyMode || !isLoggedIn}
          onSubmitText={onSubmitText}
        />

        <div style={{ marginTop: '5px' }}>
          <ul style={{ padding: '5px' }}>
            {msgList.length === 0 && !isLoggedIn && (
              <div>
                <p style={{ color: 'gray' }}>
                  {t('UserRequiredLoginBox.loginFirst')} <LoginFormTip />
                </p>
                <hr />
                <p style={{ color: 'gray', fontSize: '14px' }}>
                  {t('homeFeed.globalFeed')}
                </p>
                {Msgs(globalMsgList, worker!, userMap, relayUrls)}
              </div>
            )}
            {msgList.length === 0 && isLoggedIn && (
              <div>
                <p style={{ color: 'gray' }}>{t('homeFeed.noPostYet')}</p>
                <p style={{ color: 'gray' }}>{t('homeFeed.followHint')}</p>
              </div>
            )}
            {msgList.length > 0 &&
              isLoggedIn &&
              Msgs(msgList, worker!, userMap, relayUrls)}
          </ul>
        </div>
      </>
    ),
    post: (
      <div>
        <div
          style={{
            margin: '10px 0px 40px 0px',
          }}
        >
          <Button
            fullWidth
            variant="contained"
            style={{
              textTransform: 'capitalize',
              color: 'white',
            }}
            onClick={() => router.push({ pathname: Paths.write })}
          >
            <CreateIcon />
            &nbsp;{t('nav.menu.blogDashboard')}
          </Button>
        </div>
        <BlogFeeds />
      </div>
    ),
  };

  return (
    <BaseLayout>
      <Left>
        <BasicTabs items={tabItems} />
      </Left>
      <Right>
        <ul className={styles.menu}>
          <li onClick={() => router.push({ pathname: Paths.universe })}>
            <PublicIcon />
            <span style={{ marginLeft: '5px' }}>
              {'explore nostr universe'}
            </span>
          </li>
          <li onClick={() => router.push({ pathname: Paths.fof })}>
            <GroupAddIcon />
            <span style={{ marginLeft: '5px' }}>
              {'find friend of friends'}
            </span>
          </li>
        </ul>
      </Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(HomePage);
