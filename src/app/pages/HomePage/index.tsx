import React, { useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import {
  Event,
  EventResponse,
  EventSetMetadataContent,
  isEventResponse,
  WellKnownEventKind,
  PublicKey,
  PrivateKey,
  RelayUrl,
  PetName,
  EventTags,
  EventContactListPTag,
  RawEvent,
  isEventPTag,
  nip19Encode,
  Nip19DataType,
} from 'service/api';
import { timeSince } from 'utils/helper';
import LoginForm from './LoginForm';
import { connect } from 'react-redux';
import { matchKeyPair } from 'service/crypto';
import RelayManager, { WsConnectStatus } from './RelayManager';
import { Content } from './Content';
import ReplyButton from './ReplyBtn';
import NavHeader from 'app/components/layout/NavHeader';
import { FromWorkerMessage } from 'service/worker/wsApi';
import {
  getLastPubKeyFromPTags,
  listenFromWsApiWorker,
  pubEvent,
  subContactList,
  subMetadata,
  subMsg,
  subUserRecommendServer,
} from 'service/worker/wsCall';
import { UserMap } from 'service/type';

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
  myAvatar: {
    width: '48px',
    height: '48px',
  },
  numberSection: {
    borderRight: '1px solid gray',
    margin: '0 10px 0 0',
  },
  numberCount: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '380',
  },
  numberText: {
    display: 'block',
    fontSize: '12px',
    textDecoration: 'underline',
    color: 'blue',
  },
  smallBtn: {
    fontSize: '12px',
    marginLeft: '5px',
    border: 'none' as const,
  },
  simpleUl: {
    padding: '0px',
    margin: '20px 0px',
    listStyle: 'none' as const,
  },
  rightMenuLi: {
    padding: '0px',
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

  const [text, setText] = useState('');
  const [msgList, setMsgList] = useState<Event[]>([]);
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactList, setMyContactList] = useState<ContactList>(new Map());
  const [myKeyPair, setMyKeyPair] = useState<KeyPair>({
    publicKey: myPublicKey,
    privateKey: myPrivateKey,
  });

  useEffect(() => {
    listenFromWsApiWorker(
      (message: FromWorkerMessage) => {
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
      (message: FromWorkerMessage) => {
        onMsgHandler(message.nostrData);
      },
    );
  }, []);

  function onMsgHandler(res: any) {
    const msg = JSON.parse(res);
    if (isEventResponse(msg)) {
      const event = (msg as EventResponse)[2];
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
            subMetadata(newPks);
          }
          break;

        case WellKnownEventKind.contact_list:
          if (event.pubkey === myKeyPair.publicKey) {
            const contacts = event.tags.filter(
              t => t[0] === EventTags.P,
            ) as EventContactListPTag[];
            contacts.forEach(c =>
              setMyContactList(
                myContactList.set(c[1], {
                  relayer: c[2],
                  name: c[3],
                }),
              ),
            );
          }
          break;

        case WellKnownEventKind.recommend_server:
          console.log('recommend_server: ', event.content);
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
    subSelfRecommendServer();
    subContactList(myKeyPair.publicKey);
  }, [Array.from(wsConnectStatus.values()), myKeyPair]);

  useEffect(() => {
    const pks = Array.from(myContactList.keys());
    if (pks.length === 0) return;

    // subscibe myself msg too
    pks.push(myKeyPair.publicKey);
    subMetadata(pks);
    subMsg(pks);
  }, [myContactList.keys()]);

  const subSelfMetadata = async () => {
    subMetadata([myKeyPair.publicKey]);
  };

  const subSelfRecommendServer = async () => {
    subUserRecommendServer([myKeyPair.publicKey]);
  };

  const handleSubmitText = async (formEvt: React.FormEvent) => {
    formEvt.preventDefault();

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
    pubEvent(event);

    // clear the textarea
    setText('');
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
            <div style={styles.postBox}>
              <form onSubmit={handleSubmitText}>
                <div style={styles.postHintText}>你在想什么？</div>
                <textarea
                  style={styles.postTextArea}
                  value={text}
                  onChange={event => setText(event.target.value)}
                ></textarea>
                <div style={styles.btn}>
                  <button type="submit">发送</button>
                </div>
              </form>
            </div>

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
            <div style={{ marginBottom: '10px' }}>
              <img
                style={styles.myAvatar}
                src={userMap.get(myKeyPair.publicKey)?.picture}
                alt=""
              />
              <span
                style={{
                  marginLeft: '20px',
                  fontSize: '20px',
                  fontWeight: '500',
                }}
              >
                {isLoggedIn == true
                  ? userMap.get(myKeyPair.publicKey)?.name
                  : '请先登录'}
              </span>
              <span
                style={{ display: 'block', fontSize: '14px', margin: '5px' }}
              >
                {isLoggedIn == true
                  ? userMap.get(myKeyPair.publicKey)?.about
                  : ''}
              </span>
            </div>

            <div
              style={{
                padding: '2px 3px 1px 8px',
                borderBottom: '2px solid #ffed00',
                fontSize: '14px',
                color: 'gray',
                background: '#fffcaa',
              }}
            >
              公钥：
              {isLoggedIn &&
                myKeyPair.publicKey &&
                shortPublicKey(
                  nip19Encode(myKeyPair.publicKey, Nip19DataType.Pubkey),
                )}
            </div>

            <Grid container style={{ marginTop: '20px' }}>
              <Grid item xs={3} style={styles.numberSection}>
                <span style={styles.numberCount}>
                  {Array.from(myContactList.keys()).length}
                </span>
                <span>
                  <a style={styles.numberText} href={'/contact/' + myPublicKey}>
                    关注
                  </a>
                </span>
              </Grid>
              <Grid item xs={3} style={styles.numberSection}>
                <span style={styles.numberCount}>未知</span>
                <span>
                  <a style={styles.numberText} href="">
                    被关注
                  </a>
                </span>
              </Grid>
              <Grid item xs={3}>
                <span style={styles.numberCount}>未知</span>
                <span>
                  <a style={styles.numberText} href="">
                    消息
                  </a>
                </span>
              </Grid>
            </Grid>
            <hr />
            <LoginForm />
            <hr />
            <ul style={styles.simpleUl}>
              <li style={styles.rightMenuLi}>
                <a href="http://">@提到我的</a>
              </li>
              <li style={styles.rightMenuLi}>
                <a href="http://">私信</a>
              </li>
              <li style={styles.rightMenuLi}>
                <a href="http://">互动</a>
              </li>
              <li style={styles.rightMenuLi}>
                <a href="http://">公众号</a>
              </li>
            </ul>
            <hr />
            <RelayManager />
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default connect(mapStateToProps)(HomePage);
