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
  isEventETag,
  isEventPTag,
  EventId,
  EventETag,
  EventTags,
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
  eventId: EventId;
}

export const EventPage = ({ isLoggedIn, myPublicKey, myPrivateKey }) => {
  const { eventId } = useParams<UserParams>();
  const [relays, setRelays] = useState<string[]>([]);
  const [wsConnectStatus, setWsConnectStatus] = useState<WsConnectStatus>(
    new Map(),
  );

  const [unknownPks, setUnknownPks] = useState<PublicKey[]>([]);
  const [msgList, setMsgList] = useState<Event[]>([]);
  const [userMap, setUserMap] = useState<UserMap>(new Map());
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
            const replyToEventIds = oldArray
              .map(e => getEventIdsFromETags(e.tags))
              .reduce((prev, current) => prev.concat(current), []);

            if (
              !oldArray.map(e => e.id).includes(event.id) &&
              (replyToEventIds.length === 0 ||
                replyToEventIds.includes(event.id))
            ) {
              // only add un-duplicated and replyTo msg
              const newItems = [...oldArray, event];
              // sort by timestamp in asc
              const sortedItems = newItems.sort((a, b) =>
                a.created_at >= b.created_at ? 1 : -1,
              );
              return sortedItems;
            }
            return oldArray;
          });

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
    if (isLoggedIn !== true) return;

    setMyKeyPair({
      publicKey: myPublicKey,
      privateKey: myPrivateKey,
    });
  }, [isLoggedIn]);

  useEffect(() => {
    subMsgByIds([eventId]);
  }, [Array.from(wsConnectStatus.values()), eventId]);

  useEffect(() => {
    if (unknownPks.length > 0) {
      subMetadata(unknownPks);
    }
  }, [unknownPks, Array.from(wsConnectStatus.values())]);

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
      subMsgByIds(newIds);
    }
  }, [Array.from(wsConnectStatus.values()), eventId, msgList.values()]);

  useEffect(() => {
    const msgIds = msgList.map(e => e.id);
    if (msgIds.length > 0) {
      subMsgByTags(msgIds);
    }
  }, [msgList]);

  const subMsgByIds = async (eventIds: EventId[]) => {
    const filter: Filter = {
      ids: eventIds,
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

  const subMsgByTags = async (tags: EventId[]) => {
    const filter: Filter = {
      '#e': tags,
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

  const subMetadata = async (pks: PublicKey[]) => {
    wsConnectStatus.forEach((connected, url) => {
      if (connected === true) {
        wsApiList
          .filter(ws => ws.url() === url)
          .forEach(ws => ws.subUserMetadata(pks));
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

  const getEventIdsFromETags = (tags: any[]) => {
    const eventIds = tags.filter(t => isEventETag(t)).map(t => t[1] as EventId);
    return eventIds;
  };

  const getLastEventIdFromETags = (tags: any[]) => {
    const eventIds = tags.filter(t => isEventETag(t)).map(t => t[1]);
    if (eventIds.length > 0) {
      return eventIds[eventIds.length - 1] as string;
    } else {
      return null;
    }
  };

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
            <a href="https://github.com/digi-monkey/flycat-web">Github</a>
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
            <div style={styles.message}>
              <h3>交谈消息</h3>
              <hr />
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

export default connect(mapStateToProps)(EventPage);
