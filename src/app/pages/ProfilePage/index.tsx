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
  isEventPTag,
  RawEvent,
  deserializeMetadata,
} from 'service/api';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import { CallRelay, CallRelayType } from 'service/worker/type';
import { getPkFromFlycatShareHeader } from 'service/helper';
import { UserMap } from 'service/type';
import { UserHeader, UserProfileBox } from 'app/components/layout/UserBox';
import { ProfileShareMsg, ShareMsg } from 'app/components/layout/msg/ShareMsg';
import { ProfileTextMsg } from 'app/components/layout/msg/TextMsg';
import { t } from 'i18next';
import { isFlycatShareHeader, CacheIdentifier } from 'service/flycat-protocol';
import { useTranslation } from 'react-i18next';
import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import { loginMapStateToProps } from 'app/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { Article, Nip23 } from 'service/nip/23';
import { Box, Button, useTheme } from '@mui/material';
import { CommitCalendar } from 'app/components/ContributorCalendar/Calendar';
import BasicTabs from 'app/components/layout/SimpleTabs';
import { PersonalBlogFeedItem } from '../Blog/FeedItem';
import { useDateBookData } from 'hooks/useDateBookData';
import { TagItem } from '../Blog/hashTags/TagItem';
import { ProfileBlogMsgItem } from '../Blog/MsgItem';

// don't move to useState inside components
// it will trigger more times unnecessary
let myContactEvent: Event;
let userContactEvent: Event;

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
    //padding: '10px',
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
interface UserParams {
  publicKey: string;
}

export const ProfilePage = ({ isLoggedIn, signEvent }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { publicKey } = useParams<UserParams>();
  const myPublicKey = useReadonlyMyPublicKey();

  const [msgList, setMsgList] = useState<Event[]>([]);
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactList, setMyContactList] = useState<ContactList>(new Map());
  const [userContactList, setUserContactList] = useState<ContactList>(
    new Map(),
  );
  const [articles, setArticles] = useState<Article[]>([]);

  const { worker, newConn } = useCallWorker({
    onMsgHandler,
    updateWorkerMsgListenerDeps: [myPublicKey, publicKey],
  });

  function onMsgHandler(res: any) {
    const msg = JSON.parse(res);
    if (isEventSubResponse(msg)) {
      const event = (msg as EventSubResponse)[2];
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
          if (event.pubkey === myPublicKey) {
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

        case WellKnownEventKind.long_form:
          const article = Nip23.toArticle(event);
          setArticles(prev => {
            if (prev.map(p => p.eventId).includes(event.id)) return prev;

            const index = prev.findIndex(p => p.id === article.id);
            if (index !== -1) {
              const old = prev[index];
              if (old.updated_at >= article.updated_at) {
                return prev;
              } else {
                return prev.map((p, id) => {
                  if (id === index) return article;
                  return p;
                });
              }
            }

            // only add un-duplicated and replyTo msg
            const newItems = [...prev, article];
            // sort by timestamp in asc
            const sortedItems = newItems.sort((a, b) =>
              a.updated_at >= b.updated_at ? -1 : 1,
            );
            return sortedItems;
          });
          break;

        default:
          break;
      }
    }
  }

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
    // todo: validate publicKey
    if (publicKey.length === 0) return;
    if (newConn.length === 0) return;

    const pks = [publicKey];
    if (isLoggedIn && myPublicKey.length > 0) {
      pks.push(myPublicKey);
    }

    const callRelay: CallRelay = {
      type: CallRelayType.batch,
      data: newConn,
    };
    worker?.subContactList(pks, undefined, undefined, callRelay);
    worker?.subMetadata(pks, undefined, undefined, callRelay);
    worker?.subMsg([publicKey], undefined, undefined, callRelay);
    worker?.subNip23Posts({ pks: [publicKey], callRelay });
  }, [newConn]);

  const dateBooks = useDateBookData(articles);

  const followUser = async () => {
    if (signEvent == null) {
      return alert('no sign method!');
    }

    const contacts = Array.from(myContactList.entries());
    console.log('contact-length: ', contacts.length);
    if (contacts.length === 0) {
      const isConfirmed = window.confirm(
        'hey you have 0 followings, are you sure to continue? \n\n(if you think 0 followings is a wrong, please click CANCEL and try again, otherwise you might lost all your following!)',
      );
      if (!isConfirmed) {
        return;
      }
    }
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
      myPublicKey,
      WellKnownEventKind.contact_list,
      tags,
    );
    const event = await signEvent(rawEvent);
    worker?.pubEvent(event);

    alert('done, refresh page please!');
  };
  const unfollowUser = async () => {
    if (signEvent == null) {
      return alert('no sign method!');
    }

    const contacts = Array.from(myContactList.entries());
    if (contacts.length === 0) {
      const isConfirmed = window.confirm(
        'hey you have 0 followings, are you sure to continue? \n\n(if you think 0 followings is a wrong, please click CANCEL and try again, otherwise you might lost all your following!)',
      );
      if (!isConfirmed) {
        return;
      }
    }
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
      myPublicKey,
      WellKnownEventKind.contact_list,
      tags,
    );
    const event = await signEvent(rawEvent);
    worker?.pubEvent(event);

    alert('done, refresh page please!');
  };
  const followOrUnfollowOnClick =
    isLoggedIn && myContactList.get(publicKey) ? unfollowUser : followUser;

  const directorys: string[][] = articles
    .filter(a => a.dirs != null)
    .map(a => a.dirs!);

  const tabItems = {
    note: (
      <ul style={styles.msgsUl}>
        {msgList.map((msg, index) => {
          if (Nip23.isBlogMsg(msg)) {
            return (
              <ProfileBlogMsgItem
                event={msg}
                userMap={userMap}
                worker={worker!}
                key={msg.id}
              />
            );
          } else {
            return (
              <ProfileTextMsg
                msgEvent={msg}
                key={msg.id}
                userMap={userMap}
                replyTo={msg.tags
                  .filter(t => t[0] === EventTags.P)
                  .map(t => {
                    return {
                      name: userMap.get(t[1])?.name,
                      pk: t[1],
                    };
                  })}
                worker={worker!}
                lightingAddress={
                  userMap.get(msg.pubkey)?.lud06 ||
                  userMap.get(msg.pubkey)?.lud16
                }
              />
            );
          }
        })}
      </ul>
    ),
    post: (
      <ul style={styles.msgsUl}>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <Button
            fullWidth
            variant="text"
            onClick={() => {
              window.open('/blog/' + publicKey, '__blank');
            }}
          >
            {"go to the user's blog page"}
          </Button>
        </div>
        {articles.map(a => (
          <PersonalBlogFeedItem
            article={a}
            lightingAddress={
              userMap.get(a.pubKey)?.lud06 || userMap.get(a.pubKey)?.lud16
            }
          />
        ))}
      </ul>
    ),
  };
  return (
    <BaseLayout>
      <Left>
        <div style={styles.userProfile}>
          <UserHeader
            pk={publicKey}
            followOrUnfollow={!(isLoggedIn && myContactList.get(publicKey))}
            followOrUnfollowOnClick={followOrUnfollowOnClick}
            metadata={userMap.get(publicKey)}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <CommitCalendar pk={publicKey} />
        </div>

        <div style={styles.message}>
          <BasicTabs items={tabItems} />
        </div>
      </Left>
      <Right>
        {dateBooks.length > 0 && (
          <div style={{ marginTop: '10px' }}>{'Collection'}</div>
        )}
        <div style={{ marginTop: '20px', fontSize: '14px' }}>
          {dateBooks.map(book => (
            <div
              style={{
                color: 'gray',
                padding: '5px 0px',
                margin: '10px 0px',
                borderBottom: '1px dashed rgb(221, 221, 221)',
                textTransform: 'capitalize',
              }}
            >
              <span>{book.title}</span>
              <span style={{ float: 'right' }}>
                {'('}
                {book.count}
                {')'}
              </span>
            </div>
          ))}
          {directorys
            .map(d => d[0])
            .filter((value, index, self) => self.indexOf(value) === index)
            .map(dir => (
              <div
                style={{
                  color: 'gray',
                  padding: '5px 0px',
                  margin: '10px 0px',
                  borderBottom: '1px dashed rgb(221, 221, 221)',
                  textTransform: 'capitalize',
                }}
              >
                <span>{dir}</span>

                <span style={{ float: 'right' }}>
                  {'('}
                  {
                    articles
                      .filter(a => a.dirs != null)
                      .filter(a => a.dirs![0] === dir).length
                  }
                  {')'}
                </span>
              </div>
            ))}
        </div>
        <div>
          <div style={{ marginTop: '20px', fontSize: '14px' }}>
            {articles
              .map(article => article.hashTags)
              .flat(Infinity)
              .filter(t => typeof t === 'string')
              .map(t => (
                <TagItem tag={t as string} />
              ))}
          </div>
        </div>
      </Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(ProfilePage);
