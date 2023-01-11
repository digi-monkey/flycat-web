import React, { useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import {
  Event,
  EventResponse,
  EventSetMetadataContent,
  Filter,
  isEventResponse,
  WellKnownEventKind,
  WsApi,
  PublicKey,
  PrivateKey,
  RelayUrl,
  PetName,
  EventTags,
  EventContactListPTag,
  isEventETag,
  isEventPTag,
  nip19Encode,
  Nip19DataType,
  RawEvent,
} from 'service/api';
import { timeSince } from 'utils/helper';
import LoginForm from '../HomePage/LoginForm';
import { connect } from 'react-redux';
import RelayManager, { WsConnectStatus } from '../HomePage/RelayManager';
import { Content } from '../HomePage/Content';
import ReplyButton from '../HomePage/ReplyBtn';
import { useParams } from 'react-router-dom';

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

const wsApiList: WsApi[] = [];

export type UserMap = Map<PublicKey, EventSetMetadataContent>;
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

interface UserParams {
  publicKey: string;
}

export const ProfilePage = ({ isLoggedIn, myPublicKey, myPrivateKey }) => {
  const { publicKey } = useParams<UserParams>();
  const [relays, setRelays] = useState<string[]>([]);
  const [wsConnectStatus, setWsConnectStatus] = useState<WsConnectStatus>(
    new Map(),
  );

  const [msgList, setMsgList] = useState<Event[]>([]);
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactList, setMyContactList] = useState<ContactList>(new Map());
  const [userContactList, setUserContactList] = useState<ContactList>(
    new Map(),
  );
  const [myKeyPair, setMyKeyPair] = useState<KeyPair>({
    publicKey: myPublicKey,
    privateKey: myPrivateKey,
  });

  useEffect(() => {
    // connect to relayers
    relays.forEach(url => {
      if (wsApiList.filter(ws => ws.url() === url).length === 0) {
        // only create new wsApi
        let wsApi: WsApi | undefined;
        wsApi = new WsApi(url, {
          onMsgHandler: onMsgHandler,
          onOpenHandler: event => {
            if (wsApi?.isConnected() === true) {
              console.log('ws connected!', event);
              setWsConnectStatus(prev => {
                const newMap = new Map(prev);
                newMap.set(wsApi!.url(), true);
                return newMap;
              });
            }
          },
        });
        wsApiList.push(wsApi);
      }
    });
  }, [relays]);

  function onMsgHandler(res: any) {
    const msg = JSON.parse(res.data);
    if (isEventResponse(msg)) {
      const event = (msg as EventResponse)[2];
      switch (event.kind) {
        case WellKnownEventKind.set_metadata:
          const metadata: EventSetMetadataContent = JSON.parse(event.content);
          setUserMap(prev => {
            const newMap = new Map(prev);
            newMap.set(event.pubkey, metadata);
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
          if (event.pubkey === publicKey) {
            const contacts = event.tags.filter(
              t => t[0] === EventTags.P,
            ) as EventContactListPTag[];
            contacts.forEach(c =>
              setUserContactList(
                userContactList.set(c[1], {
                  relayer: c[2],
                  name: c[3],
                }),
              ),
            );
          } else if (event.pubkey === myKeyPair.publicKey) {
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
    subUserContactList(myKeyPair.publicKey);
  }, [Array.from(wsConnectStatus.values()), myKeyPair]);

  useEffect(() => {
    subUserContactList(publicKey);
    subMetadata([publicKey]);
    subMsg([publicKey]);
  }, [Array.from(wsConnectStatus.values())]);

  const subMsg = async (pks: PublicKey[]) => {
    const filter: Filter = {
      authors: pks,
      limit: 50,
    };
    wsConnectStatus.forEach((connected, url) => {
      if (connected === true) {
        wsApiList
          .filter(ws => ws.url() === url)
          .map(ws => ws.subFilter(filter));
      }
    });
  };

  const subSelfMetadata = async () => {
    wsConnectStatus.forEach((connected, url) => {
      if (connected === true) {
        wsApiList
          .filter(ws => ws.url() === url)
          .map(ws => ws.subUserMetadata([myKeyPair.publicKey]));
      }
    });
  };

  const subMetadata = async (pks: PublicKey[]) => {
    wsConnectStatus.forEach((connected, url) => {
      if (connected === true) {
        wsApiList
          .filter(ws => ws.url() === url)
          .map(ws => ws.subUserMetadata(pks));
      }
    });
  };

  const subUserContactList = async (publicKey: PublicKey) => {
    wsConnectStatus.forEach((connected, url) => {
      if (connected === true) {
        wsApiList
          .filter(ws => ws.url() === url)
          .map(ws => ws.subUserContactList(publicKey));
      }
    });
  };

  const shortPublicKey = (key: PublicKey | undefined) => {
    if (key) {
      return key.slice(0, 8) + '..' + key.slice(48);
    } else {
      return 'unknown';
    }
  };

  const getLastPubKeyFromPTags = (tags: any[]) => {
    const pks = tags.filter(t => isEventPTag(t)).map(t => t[1]);
    if (pks.length > 0) {
      return pks[pks.length - 1] as string;
    } else {
      return null;
    }
  };

  const followUser = async () => {
    const contacts = Array.from(myContactList.entries());
    const tags = contacts.map(
      c =>
        [
          EventTags.P,
          c[0],
          c[1].relayer ?? '',
          c[1].name ?? '',
        ] as EventContactListPTag,
    );
    tags.push([EventTags.P, publicKey, '', '']);
    if (tags.length != contacts.length + 1) {
      return alert('something went wrong with contact list');
    }

    const rawEvent = new RawEvent(
      myKeyPair.publicKey,
      WellKnownEventKind.contact_list,
      tags,
    );
    const event = await rawEvent.toEvent(myKeyPair.privateKey);

    wsConnectStatus.forEach((connected, url) => {
      if (connected === true) {
        wsApiList.filter(ws => ws.url() === url).map(ws => ws.pubEvent(event));
      }
    });
  };
  const unfollowUser = async () => {
    const contacts = Array.from(myContactList.entries());
    const tags = contacts
      .filter(c => c[0] !== publicKey)
      .map(
        c =>
          [
            EventTags.P,
            c[0],
            c[1].relayer ?? '',
            c[1].name ?? '',
          ] as EventContactListPTag,
      );
    if (tags.length != contacts.length - 1) {
      return alert('something went wrong with contact list');
    }

    const rawEvent = new RawEvent(
      myKeyPair.publicKey,
      WellKnownEventKind.contact_list,
      tags,
    );
    const event = await rawEvent.toEvent(myKeyPair.privateKey);

    wsConnectStatus.forEach((connected, url) => {
      if (connected === true) {
        wsApiList.filter(ws => ws.url() === url).map(ws => ws.pubEvent(event));
      }
    });
  };

  const followOrUnfollowText =
    isLoggedIn && myContactList.get(publicKey) ? '取消关注' : '关注他';
  const followOrUnfollowOnClick =
    isLoggedIn && myContactList.get(publicKey) ? unfollowUser : followUser;

  return (
    <div style={styles.root}>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <div style={styles.title}>
            飞猫FlyCat{' '}
            <span style={{ fontSize: '14px', color: 'red' }}>测试版</span>{' '}
          </div>
          <small style={{ color: 'black' }}>开源的 nostr 中文客户端</small>
          &nbsp;
          <small>
            <a href="https://github.com/digi-monkey/flycat-protocol">Github</a>
          </small>
        </Grid>
        <Grid item xs={8}>
          <div className="menu">
            <ul style={styles.ul}>
              <li style={styles.li}>
                <a href="/">首页</a>
              </li>
              <li style={styles.li}>
                <a href="">我的主页</a>
              </li>
              <li style={styles.li}>
                <a href="">私信</a>
              </li>
              <li style={styles.li}>
                <a href="">连接器</a>
              </li>
              <li style={styles.li}>
                <a href="">随便看看</a>
              </li>
              <li style={styles.li}>
                <a href="">搜索</a>
              </li>
              <li style={styles.li}>
                <a href="">设置</a>
              </li>
              <li style={styles.li}>
                <a href="">退出</a>
              </li>
            </ul>
          </div>
        </Grid>
      </Grid>

      <div style={styles.content}>
        <Grid container>
          <Grid item xs={8} style={styles.left}>
            <div style={styles.userProfile}>
              <Grid container style={{ background: '#F7F5EB' }}>
                <Grid item xs={2}>
                  <img
                    style={styles.userProfileAvatar}
                    src={userMap.get(publicKey)?.picture}
                    alt=""
                  />
                </Grid>
                <Grid item xs={10}>
                  <div style={styles.userProfileName}>
                    {userMap.get(publicKey)?.name}
                  </div>
                  <div style={styles.userProfileBtnGroup}>
                    <button onClick={followOrUnfollowOnClick}>
                      {followOrUnfollowText}
                    </button>
                    &nbsp;
                    <button
                      onClick={() => {
                        alert('not impl 还没做');
                      }}
                    >
                      私信他
                    </button>
                  </div>
                </Grid>
              </Grid>
            </div>

            <div style={styles.message}>
              <ul style={styles.msgsUl}>
                {msgList.map((msg, index) => (
                  <li key={index} style={styles.msgItem}>
                    <Grid container>
                      <Grid item xs={12}>
                        <span style={styles.msgWord}>
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
                            wsConnectStatus={wsConnectStatus}
                            wsApiList={wsApiList}
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
              <span
                style={{ display: 'block', fontSize: '14px', margin: '5px' }}
              >
                ta的自述：
                {isLoggedIn == true ? userMap.get(publicKey)?.about : ''}
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
              ta的公钥：
              {shortPublicKey(nip19Encode(publicKey, Nip19DataType.Pubkey))}
            </div>

            <Grid container style={{ marginTop: '20px' }}>
              <Grid item xs={3} style={styles.numberSection}>
                <span style={styles.numberCount}>
                  {Array.from(userContactList.keys()).length}
                </span>
                <span>
                  <a style={styles.numberText} href="">
                    ta的关注
                  </a>
                </span>
              </Grid>
              <Grid item xs={3} style={styles.numberSection}>
                <span style={styles.numberCount}>未知</span>
                <span>
                  <a style={styles.numberText} href="">
                    ta被关注
                  </a>
                </span>
              </Grid>
              <Grid item xs={3}>
                <span style={styles.numberCount}>未知</span>
                <span>
                  <a style={styles.numberText} href="">
                    ta的消息
                  </a>
                </span>
              </Grid>
            </Grid>
            <hr />
            <LoginForm />
            <hr />
            <RelayManager
              setRelaysCallback={setRelays}
              wsConnectStatus={wsConnectStatus}
            />
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default connect(mapStateToProps)(ProfilePage);
