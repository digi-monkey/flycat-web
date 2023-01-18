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
import { timeSince } from 'utils/helper';
import LoginForm from './LoginForm';
import { connect } from 'react-redux';
import { matchKeyPair } from 'service/crypto';
import RelayManager, { WsConnectStatus } from './RelayManager';
import { Content } from './Content';
import NavHeader from 'app/components/layout/NavHeader';
import { FromWorkerMessageData } from 'service/worker/type';
import { getLastPubKeyFromPTags } from 'service/helper';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import { UserBox, UserRequiredLoginBox } from 'app/components/layout/UserBox';
import { NoticeBox } from 'app/components/layout/NoticeBox';
import { PubNoteTextarea } from 'app/components/layout/PubNoteTextarea';
import ReplyButton from './ReplyBtn';

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

  useEffect(() => {
    const worker = new CallWorker(
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
          if (event.pubkey === myKeyPair.publicKey) {
            if (
              myContactEvent == null ||
              myContactEvent?.created_at! < event.created_at
            ) {
              const contacts = event.tags.filter(
                t => t[0] === EventTags.P,
              ) as EventContactListPTag[];
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
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn !== true) return;
    if (myKeyPair.publicKey == null) return;

    subSelfMetadata();
    worker?.subContactList(myKeyPair.publicKey);
  }, [myKeyPair, wsConnectStatus]);

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
    if (pks.length === 0) return;

    // subscibe myself msg too
    pks.push(myKeyPair.publicKey);
    worker?.subMetadata(pks);
    worker?.subMsg(pks);
  }, [myContactList.size]);

  const subSelfMetadata = async () => {
    worker?.subMetadata([myKeyPair.publicKey]);
  };

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

  const shortPublicKey = (key: PublicKey | undefined) => {
    if (key) {
      return key.slice(0, 8) + '..' + key.slice(48);
    } else {
      return 'unknown';
    }
  };

  return (
    <div style={styles.root}>
      <NavHeader />
      <div style={styles.content}>
        <Grid container>
          <Grid item xs={8} style={styles.left}>
            <PubNoteTextarea onSubmitText={onSubmitText} />

            <div style={styles.message}>
              <ul style={styles.msgsUl}>
                {msgList.map((msg, index) => (
                  <li key={index} style={styles.msgItem}>
                    <Grid container>
                      <Grid item xs={2} style={{ textAlign: 'left' as const }}>
                        <img
                          style={styles.avatar}
                          src={userMap.get(msg.pubkey)?.picture}
                          alt=""
                        />
                      </Grid>
                      <Grid item xs={10}>
                        <span style={styles.msgWord}>
                          <a
                            style={styles.userName}
                            href={'/user/' + msg?.pubkey}
                          >
                            @{userMap.get(msg.pubkey)?.name}
                          </a>
                          {getLastPubKeyFromPTags(msg.tags) && (
                            <span>
                              回复
                              <a
                                style={styles.userName}
                                href={
                                  '/user/' + getLastPubKeyFromPTags(msg.tags)
                                }
                              >
                                @
                                {userMap.get(getLastPubKeyFromPTags(msg.tags)!)
                                  ?.name ||
                                  shortPublicKey(
                                    getLastPubKeyFromPTags(msg.tags)!,
                                  )}
                              </a>
                              {/* 
                              的
                              <a
                                style={styles.userName}
                                href={
                                  '/msg/' +
                                  getLastEventIdFromETags(msg.tags)?.slice(
                                    0,
                                    10,
                                  )
                                }
                              >
                                发言
                              </a>
            
                              */}
                            </span>
                          )}
                          <Content text={msg.content} />
                        </span>
                        <span style={styles.time}>
                          {timeSince(msg?.created_at)}
                        </span>
                        <span style={styles.time}>
                          <button
                            onClick={() =>
                              window.open(`/event/${msg.id}`, '_blank')
                            }
                            style={styles.smallBtn}
                          >
                            查看对话
                          </button>
                          <button
                            onClick={() => {
                              alert('not impl 还没做');
                            }}
                            style={styles.smallBtn}
                          >
                            点赞
                          </button>
                        </span>
                        <span style={styles.time}>
                          <ReplyButton
                            replyToEventId={msg.id}
                            replyToPublicKey={msg.pubkey}
                            myKeyPair={myKeyPair}
                          />
                        </span>
                      </Grid>
                    </Grid>
                  </li>
                ))}
              </ul>
            </div>
          </Grid>
          <Grid item xs={4} style={styles.right}>
            {isLoggedIn && (
              <UserBox
                pk={myKeyPair.publicKey}
                followCount={myContactList.size}
                avatar={userMap.get(myKeyPair.publicKey)?.picture}
                name={userMap.get(myKeyPair.publicKey)?.name}
                about={userMap.get(myKeyPair.publicKey)?.about}
              />
            )}
            {!isLoggedIn && <UserRequiredLoginBox />}
            <hr />
            <LoginForm />
            <hr />
            <NoticeBox />
            <hr />
            <RelayManager />
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default connect(mapStateToProps)(HomePage);
