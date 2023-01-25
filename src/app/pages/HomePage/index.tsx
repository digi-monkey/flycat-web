import React, { useState, useEffect, useRef } from 'react';
import { Grid } from '@mui/material';
import {
  Event,
  EventSubResponse,
  EventSetMetadataContent,
  isEventSubResponse,
  WellKnownEventKind,
  PublicKey,
  PrivateKey,
  RelayUrl,
  PetName,
  EventTags,
  EventContactListPTag,
  RawEvent,
  isEventPTag,
} from 'service/api';
import { connect } from 'react-redux';
import { matchKeyPair } from 'service/crypto';
import RelayManager, {
  WsConnectStatus,
} from '../../components/layout/RelayManager';
import NavHeader from 'app/components/layout/NavHeader';
import { FromWorkerMessageData } from 'service/worker/type';
import { compareMaps, getPkFromFlycatShareHeader } from 'service/helper';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import { UserBox, UserRequiredLoginBox } from 'app/components/layout/UserBox';
import { PubNoteTextarea } from 'app/components/layout/PubNoteTextarea';
import { TextMsg } from 'app/components/layout/TextMsg';
import {
  CacheIdentifier,
  FlycatShareHeader,
  isFlycatShareHeader,
} from 'service/flycat-protocol';
import { ShareMsg } from 'app/components/layout/ShareMsg';
import { useTranslation } from 'react-i18next';

// don't move to useState inside components
// it will trigger more times unnecessary
let myContactEvent: Event;

const mapStateToProps = state => {
  return {
    isLoggedIn: state.loginReducer.isLoggedIn,
    myPublicKey: state.loginReducer.publicKey,
    myPrivateKey: state.loginReducer.privateKey,
  };
};

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
export interface KeyPair {
  publicKey: PublicKey;
  privateKey: PrivateKey;
}

export const HomePage = ({ isLoggedIn, myPublicKey, myPrivateKey }) => {
  const { t } = useTranslation();
  const [wsConnectStatus, setWsConnectStatus] = useState<WsConnectStatus>(
    new Map(),
  );

  const [msgList, setMsgList] = useState<Event[]>([]);
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactList, setMyContactList] = useState<ContactList>(new Map());
  const [myKeyPair, setMyKeyPair] = useState<KeyPair>({
    publicKey: myPublicKey,
    privateKey: myPrivateKey,
  });
  const [worker, setWorker] = useState<CallWorker>();

  // use in listener to get runtime updated value
  function _wsConnectStatus() {
    return wsConnectStatus;
  }

  useEffect(() => {
    const worker = new CallWorker(
      (message: FromWorkerMessageData) => {
        if (message.wsConnectStatus) {
          if (compareMaps(_wsConnectStatus(), message.wsConnectStatus)) {
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
        onMsgHandler(message.nostrData);
      },
      'homeIndex',
    );
    setWorker(worker);
    worker.pullWsConnectStatus();

    return () => {
      worker.removeListeners();
    };
  }, []);

  function onMsgHandler(res: any) {
    const msg = JSON.parse(res);
    if (isEventSubResponse(msg)) {
      const event = (msg as EventSubResponse)[2];
      switch (event.kind) {
        case WellKnownEventKind.set_metadata:
          const metadata: EventSetMetadataContent = JSON.parse(event.content);
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
          setMsgList(oldArray => {
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
            worker?.subMetadata(newPks);
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
          }
          break;

        default:
          break;
      }
    }
  }

  useEffect(() => {
    if (isLoggedIn !== true) return;

    setMyKeyPair({
      publicKey: myPublicKey,
      privateKey: myPrivateKey,
    });

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
        onMsgHandler(message.nostrData);
      },
    );
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn !== true) return;
    if (myPublicKey.length === 0) return;

    worker?.subMetaDataAndContactList(
      [myPublicKey],
      false,
      'userMetaAndContact',
    );
  }, [myPublicKey, wsConnectStatus]);

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
    // subscibe myself msg too
    if (!pks.includes(myPublicKey) && myPublicKey.length > 0) {
      pks.push(myPublicKey);
    }

    if (pks.length > 0) {
      worker?.subMetadata(pks, false, 'homeMetadata');
      worker?.subMsg(pks, true, 'homeMsg');
      //worker?.subMsgAndMetaData(pks, true, 'homeMsgAndMetadata');
    }
  }, [myContactList.size]);

  const onSubmitText = async (text: string) => {
    if (myKeyPair.privateKey === '') {
      alert('set privateKey first!');
      return;
    }
    if (!matchKeyPair(myKeyPair.publicKey, myKeyPair.privateKey)) {
      alert('public key and private key not matched!');
      return;
    }

    const rawEvent = new RawEvent(
      myKeyPair.publicKey,
      WellKnownEventKind.text_note,
      undefined,
      text,
    );
    const event = await rawEvent.toEvent(myKeyPair.privateKey);
    console.log(text, event);

    // publish to all connected relays
    worker?.pubEvent(event);
  };

  return (
    <div style={styles.root}>
      <NavHeader />
      <div style={styles.content}>
        <Grid container>
          <Grid item xs={8} style={styles.left}>
            <PubNoteTextarea
              disabled={!myPrivateKey}
              onSubmitText={onSubmitText}
            />

            <div style={styles.message}>
              <ul style={styles.msgsUl}>
                {msgList.length === 0 && (
                  <p style={{ color: 'gray' }}>{t('homeFeed.noPostYet')}</p>
                )}
                {msgList.map((msg, index) => {
                  //@ts-ignore
                  const flycatShareHeaders: FlycatShareHeader[] =
                    msg.tags.filter(t => isFlycatShareHeader(t));
                  if (flycatShareHeaders.length > 0) {
                    const blogPk = getPkFromFlycatShareHeader(
                      flycatShareHeaders[flycatShareHeaders.length - 1],
                    );
                    const cacheHeaders = msg.tags.filter(
                      t => t[0] === CacheIdentifier,
                    );
                    let articleCache = {
                      title: t('thread.noArticleShareTitle'),
                      url: '',
                      blogName: t('thread.noBlogShareName'),
                      blogPicture: '',
                    };
                    if (cacheHeaders.length > 0) {
                      const cache = cacheHeaders[cacheHeaders.length - 1];
                      articleCache = {
                        title: cache[1],
                        url: cache[2],
                        blogName: cache[3],
                        blogPicture: cache[4],
                      };
                    }
                    return (
                      <ShareMsg
                        key={index}
                        content={msg.content}
                        eventId={msg.id}
                        keyPair={myKeyPair}
                        userPk={msg.pubkey}
                        userAvatar={userMap.get(msg.pubkey)?.picture}
                        username={userMap.get(msg.pubkey)?.name}
                        createdAt={msg.created_at}
                        blogName={articleCache.blogName} //todo: fallback to query title
                        blogAvatar={
                          articleCache.blogPicture ||
                          userMap.get(blogPk)?.picture
                        }
                        articleTitle={articleCache.title} //todo: fallback to query title
                      />
                    );
                  } else {
                    return (
                      <TextMsg
                        key={index}
                        pk={msg.pubkey}
                        avatar={userMap.get(msg.pubkey)?.picture}
                        name={userMap.get(msg.pubkey)?.name}
                        content={msg.content}
                        eventId={msg.id}
                        keyPair={myKeyPair}
                        replyTo={msg.tags
                          .filter(t => t[0] === EventTags.P)
                          .map(t => {
                            return {
                              name: userMap.get(t[1])?.name,
                              pk: t[1],
                            };
                          })}
                        createdAt={msg.created_at}
                      />
                    );
                  }
                })}
              </ul>
            </div>
          </Grid>
          <Grid item xs={4} style={styles.right}>
            {isLoggedIn && (
              <UserBox
                pk={myPublicKey}
                followCount={myContactList.size}
                avatar={userMap.get(myPublicKey)?.picture}
                name={userMap.get(myPublicKey)?.name}
                about={userMap.get(myPublicKey)?.about}
              />
            )}
            {!isLoggedIn && <UserRequiredLoginBox />}
            <hr />
            <RelayManager />
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default connect(mapStateToProps)(HomePage);
