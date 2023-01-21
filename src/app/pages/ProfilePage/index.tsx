import React, { useState, useEffect } from 'react';
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
  isEventPTag,
  RawEvent,
} from 'service/api';
import { useTimeSince } from 'hooks/useTimeSince';
import LoginForm from '../../components/layout/LoginForm';
import { connect } from 'react-redux';
import RelayManager, {
  WsConnectStatus,
} from '../../components/layout/RelayManager';
import { Content } from '../../components/layout/Content';
import ReplyButton from '../../components/layout/ReplyBtn';
import { useParams } from 'react-router-dom';
import NavHeader from 'app/components/layout/NavHeader';
import { FromWorkerMessageData } from 'service/worker/type';
import {
  getLastPubKeyFromPTags,
  getPkFromFlycatShareHeader,
  shortPublicKey,
} from 'service/helper';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import { UserHeader, UserProfileBox } from 'app/components/layout/UserBox';
import { ShowThread } from 'app/components/layout/ShowThread';
import { ProfileShareMsg, ShareMsg } from 'app/components/layout/ShareMsg';
import { ProfileTextMsg } from 'app/components/layout/TextMsg';
import { t } from 'i18next';
import { isFlycatShareHeader, CacheIdentifier } from 'service/flycat-protocol';

// don't move to useState inside components
// it will trigger more times unnecessary
let myContactEvent: Event;
let userContactEvent: Event;

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
export interface KeyPair {
  publicKey: PublicKey;
  privateKey: PrivateKey;
}

interface UserParams {
  publicKey: string;
}

export const ProfilePage = ({ isLoggedIn, myPublicKey, myPrivateKey }) => {
  const { publicKey } = useParams<UserParams>();
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
    );
    setWorker(worker);
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
          if (event.pubkey === publicKey) {
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
          }
          break;

        case WellKnownEventKind.contact_list:
          if (event.pubkey === myKeyPair.publicKey) {
            if (
              myContactEvent == null ||
              myContactEvent?.created_at! < event.created_at
            ) {
              myContactEvent = event;
            }
          }

          if (event.pubkey === publicKey) {
            if (
              userContactEvent == null ||
              userContactEvent?.created_at! < event.created_at
            ) {
              userContactEvent = event;
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
    if (userContactEvent == null) return;

    const contacts = userContactEvent.tags.filter(
      t => t[0] === EventTags.P,
    ) as EventContactListPTag[];

    let cList: ContactList = new Map(userContactList);

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

    setUserContactList(cList);
  }, [userContactEvent]);

  useEffect(() => {
    if (isLoggedIn !== true) return;
    if (myKeyPair.publicKey == null) return;

    worker?.subMetadata([myKeyPair.publicKey]);
    worker?.subContactList(myKeyPair.publicKey);
  }, [wsConnectStatus, myKeyPair, worker]);

  useEffect(() => {
    worker?.subContactList(publicKey);
    worker?.subMetadata([publicKey]);
    worker?.subMsg([publicKey]);
  }, [wsConnectStatus, worker]);

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
    worker?.pubEvent(event);

    alert('done, refresh page please!');
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
    worker?.pubEvent(event);

    alert('done, refresh page please!');
  };
  const followOrUnfollowOnClick =
    isLoggedIn && myContactList.get(publicKey) ? unfollowUser : followUser;

  return (
    <div style={styles.root}>
      <NavHeader />

      <div style={styles.content}>
        <Grid container>
          <Grid item xs={8} style={styles.left}>
            <div style={styles.userProfile}>
              <UserHeader
                pk={publicKey}
                followOrUnfollow={!(isLoggedIn && myContactList.get(publicKey))}
                followOrUnfollowOnClick={followOrUnfollowOnClick}
                avatar={userMap.get(publicKey)?.picture}
                name={userMap.get(publicKey)?.name}
              />
            </div>

            <div style={styles.message}>
              <ul style={styles.msgsUl}>
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
                      <ProfileShareMsg
                        key={index}
                        content={msg.content}
                        eventId={msg.id}
                        keyPair={myKeyPair}
                        userPk={msg.pubkey}
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
                      <ProfileTextMsg
                        key={index}
                        pk={msg.pubkey}
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
            <UserProfileBox
              pk={publicKey}
              about={userMap.get(publicKey)?.about}
              followCount={userContactList.size}
            />
            <hr />
            <LoginForm />
            <hr />
            <RelayManager />
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default connect(mapStateToProps)(ProfilePage);
