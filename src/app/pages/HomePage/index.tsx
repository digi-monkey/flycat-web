import React, { useState, useEffect } from 'react';
import {
  Event,
  EventSubResponse,
  EventSetMetadataContent,
  isEventSubResponse,
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
import { connect } from 'react-redux';
import RelayManager, {
  WsConnectStatus,
} from '../../components/layout/relay/RelayManager';
import { CallRelayType, FromWorkerMessageData } from 'service/worker/type';
import { equalMaps } from 'service/helper';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import { UserBox, UserRequiredLoginBox } from 'app/components/layout/UserBox';
import { PubNoteTextarea } from 'app/components/layout/PubNoteTextarea';
import { useTranslation } from 'react-i18next';
import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import { LoginFormTip } from 'app/components/layout/NavHeader';
import { Msgs } from 'app/components/layout/msg/Msg';
import { TopArticle } from 'app/components/layout/TopArticle';
import { DiscoveryFriend } from 'app/components/layout/DiscoverFriend';
import { ThinHr } from 'app/components/layout/ThinHr';
import { TextNoteEvent } from 'app/type';
import { loginMapStateToProps } from 'app/helper';
import { SignEvent } from 'store/loginReducer';
import { useMyPublicKey } from 'hooks/useMyPublicKey';

// don't move to useState inside components
// it will trigger more times unnecessary
let myContactEvent: Event;
let myProfileEvent: Event;

const styles = {
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
  userProfileAvatar: {
    width: '60px',
    height: '60px',
  },
  userProfileName: {
    fontSize: '20px',
    fontWeight: '500',
  },
};

export type ContactList = Map<
  PublicKey,
  {
    relayer: RelayUrl;
    name: PetName;
  }
>;

export interface HomePageProps {
  isLoggedIn: boolean;
  signEvent?: SignEvent;
}

export const HomePage = ({ isLoggedIn, signEvent }: HomePageProps) => {
  const { t } = useTranslation();
  const [wsConnectStatus, setWsConnectStatus] = useState<WsConnectStatus>(
    new Map(),
  );
  const [lastWsConnectStatus, setLastWsConnectStatus] =
    useState<WsConnectStatus>(new Map());
  const [newConn, setNewConn] = useState<string[]>([]);

  const maxMsgLength = 50;
  const maxDiscoverPkLength = 50;
  const [globalMsgList, setGlobalMsgList] = useState<Event[]>([]);
  const [msgList, setMsgList] = useState<TextNoteEvent[]>([]);

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactList, setMyContactList] = useState<ContactList>(new Map());

  const myPublicKey = useMyPublicKey();

  const [discoverPks, setDiscoverPks] = useState<string[]>([]);
  const isReadonlyMode = isLoggedIn && signEvent == null;

  const [worker, setWorker] = useState<CallWorker>();
  const relayUrls = Array.from(wsConnectStatus.keys());

  // use in listener to get runtime updated value
  function _wsConnectStatus() {
    return wsConnectStatus;
  }

  useEffect(() => {
    const worker = new CallWorker(
      (message: FromWorkerMessageData) => {
        if (message.wsConnectStatus) {
          if (equalMaps(_wsConnectStatus(), message.wsConnectStatus)) {
            // no changed
            console.debug('[wsConnectStatus] same, not updating');
            return;
          }

          const data = Array.from(message.wsConnectStatus.entries());
          setWsConnectStatus(prev => {
            const newMap = new Map(prev);
            for (const d of data) {
              const relayUrl = d[0];
              const isConnected = d[1];
              if (
                newMap.get(relayUrl) &&
                newMap.get(relayUrl) === isConnected
              ) {
                continue; // no changed
              }

              newMap.set(relayUrl, isConnected);
            }

            return newMap;
          });
        }
      },
      (message: FromWorkerMessageData) => {
        onMsgHandler.bind(worker)(message.nostrData, message.relayUrl);
      },
      'homeIndex',
    );
    setWorker(worker);
    worker.pullWsConnectStatus();

    return () => {
      worker.removeListeners();
    };
  }, []);

  function onMsgHandler(this, nostrData: any, relayUrl?: string) {
    const msg = JSON.parse(nostrData);
    if (isEventSubResponse(msg)) {
      const event = (msg as EventSubResponse)[2];
      switch (event.kind) {
        case WellKnownEventKind.set_metadata:
          if (
            myPublicKey &&
            myPublicKey.length > 0 &&
            event.pubkey === myPublicKey &&
            (myProfileEvent == null ||
              myProfileEvent.created_at < event.created_at)
          ) {
            myProfileEvent = event;
          }

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
                return sortedItems;
              }
              return oldArray;
            });

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
              this.subMetadata(newPks, false, 'homeMetadata');
            }
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
            this.subMetadata(newPks);
          }
          break;

        case WellKnownEventKind.contact_list:
          if (event.pubkey === myPublicKey) {
            if (
              myContactEvent == null ||
              myContactEvent?.created_at! < event.created_at
            ) {
              myContactEvent = event;
            }
          } else {
            // discover pks(friend of friend)
            const contacts: string[] = event.tags
              .filter(t => t[0] === EventTags.P)
              .map(s => s[1])
              .filter(
                pk =>
                  !myContactList.has(pk) &&
                  pk != myPublicKey &&
                  !discoverPks.includes(pk),
              );
            if (
              contacts.length === 0 ||
              discoverPks.length >= maxDiscoverPkLength
            ) {
              return;
            }

            setDiscoverPks(prev => {
              const d = prev;
              return d
                .concat(contacts)
                .reduce((acc, curr) => {
                  if (!acc.includes(curr)) {
                    acc.push(curr);
                  }
                  return acc;
                }, [] as string[])
                .slice(0, maxDiscoverPkLength);
            });
          }
          break;

        default:
          break;
      }
    }
  }

  useEffect(() => {
    // update worker listener
    // update some deps like myPublicKey in the listener
    worker?.updateMsgListener(
      (message: FromWorkerMessageData) => {
        if (message.wsConnectStatus) {
          const data = Array.from(message.wsConnectStatus.entries());
          for (const d of data) {
            setWsConnectStatus(prev => {
              const newMap = new Map(prev);
              newMap.set(d[0], d[1]);
              return newMap;
            });
          }
        }
      },
      (message: FromWorkerMessageData) => {
        onMsgHandler.bind(worker)(message.nostrData);
      },
    );
  }, [myPublicKey, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn !== true) return;
    if (!myPublicKey || myPublicKey.length === 0) return;

    console.log('sub meta contact', myPublicKey);

    const callRelay =
      newConn.length === 0
        ? { type: CallRelayType.all, data: [] }
        : { type: CallRelayType.batch, data: newConn };
    worker?.subMetaDataAndContactList(
      [myPublicKey],
      false,
      'userMetaAndContact',
      callRelay,
    );
  }, [myPublicKey, newConn]);

  useEffect(() => {
    if (equalMaps(lastWsConnectStatus, wsConnectStatus)) {
      return;
    }

    const newConn: string[] = Array.from(wsConnectStatus)
      .map(cur => {
        const url = cur[0];
        const isConnected = cur[1];
        if (
          lastWsConnectStatus.get(url) &&
          lastWsConnectStatus.get(url) === false &&
          isConnected === true
        ) {
          return url;
        }

        if (!lastWsConnectStatus.get(url) && isConnected) {
          return url;
        }

        return null;
      })
      .filter(s => s != null) as string[];
    setLastWsConnectStatus(wsConnectStatus);
    setNewConn(newConn);
  }, [wsConnectStatus]);

  useEffect(() => {
    if (myContactEvent == null) return;

    const contacts = myContactEvent.tags.filter(
      t => t[0] === EventTags.P,
    ) as EventContactListPTag[];

    let cList: ContactList = new Map(myContactList);

    contacts.forEach(c => {
      const pk = c[1];
      const relayer = c[2];
      const name = c[3];
      if (!cList.has(pk)) {
        cList.set(pk, {
          relayer,
          name,
        });
      }
    });

    setMyContactList(cList);
  }, [myContactEvent]);

  useEffect(() => {
    const pks = Array.from(myContactList.keys());
    // subscribe myself msg too
    if (myPublicKey && !pks.includes(myPublicKey) && myPublicKey.length > 0) {
      pks.push(myPublicKey);
    }

    if (pks.length > 0 && newConn.length > 0) {
      worker?.subMetadata(pks, false, 'homeMetadata', {
        type: CallRelayType.batch,
        data: newConn,
      });
      worker?.subMsg(pks, true, 'homeMsg', {
        type: CallRelayType.batch,
        data: newConn,
      });
      //worker?.subMsgAndMetaData(pks, true, 'homeMsgAndMetadata');
    }
  }, [myContactList.size, newConn]);

  useEffect(() => {
    const pks = Array.from(myContactList.keys());
    if (pks.length > 0 && newConn.length > 0) {
      worker?.subContactList(pks, false, 'homeFriendDiscover', {
        type: CallRelayType.batch,
        data: newConn,
      });
    }
  }, [myPublicKey, myContactList.size, newConn]);

  useEffect(() => {
    if (isLoggedIn) return;
    if (newConn.length === 0) return;

    // global feed
    const filter: Filter = {
      kinds: [WellKnownEventKind.text_note],
      limit: 50,
    };
    worker?.subFilter(filter, undefined, undefined, {
      type: CallRelayType.batch,
      data: newConn,
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

  useEffect(() => {
    if (discoverPks.length > 0 && newConn.length > 0) {
      const metadata = discoverPks
        .filter(c => !userMap.get(c))
        .slice(0, maxDiscoverPkLength);
      if (metadata.length > 0) {
        worker?.subMetadata(metadata, false, 'home-discovery-pk-meta', {
          type: CallRelayType.batch,
          data: newConn,
        });
      }
    }
  }, [newConn]);

  return (
    <BaseLayout>
      <Left>
        <>
          <PubNoteTextarea
            disabled={isReadonlyMode || !isLoggedIn}
            onSubmitText={onSubmitText}
          />

          <div style={styles.message}>
            <ul style={styles.msgsUl}>
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
      </Left>
      <Right>
        <>
          <div
            style={{
              position: 'sticky',
              top: '0px',
              paddingTop: '10px',
              background: 'white',
              paddingBottom: '10px',
            }}
          >
            {isLoggedIn && (
              <UserBox
                pk={myPublicKey}
                followCount={myContactList.size}
                avatar={userMap.get(myPublicKey)?.picture}
                name={userMap.get(myPublicKey)?.name}
                about={userMap.get(myPublicKey)?.about}
                relayConnectedCount={
                  Array.from(wsConnectStatus).filter(w => w[1] === true).length
                }
                worker={worker}
                profileEvent={myProfileEvent}
              />
            )}
            {!isLoggedIn && <UserRequiredLoginBox />}
          </div>

          <TopArticle userMap={userMap} />
          <ThinHr />
          <DiscoveryFriend
            userMap={userMap}
            pks={discoverPks
              .filter(pk => !myContactList.has(pk))
              .slice(0, maxDiscoverPkLength)}
          />
        </>
        <div style={{ display: 'none' }}>
          <RelayManager />
        </div>
      </Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(HomePage);
