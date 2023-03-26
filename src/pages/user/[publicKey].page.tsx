import { Paths } from 'constants/path';
import { connect } from 'react-redux';
import { UserMap } from 'service/type';
import { TagItem } from '../blog/hashTags/TagItem';
import { useRouter } from 'next/router';
import { UserHeader } from 'components/layout/UserBox';
import { ProfileTextMsg } from 'components/layout/msg/TextMsg';
import { useTranslation } from 'next-i18next';
import { useCallWorker } from 'hooks/useWorker';
import { Article, Nip23 } from 'service/nip/23';
import { Button, useTheme } from '@mui/material';
import { CommitCalendar } from 'components/ContributorCalendar/Calendar';
import { useDateBookData } from 'hooks/useDateBookData';
import { ProfileBlogMsgItem } from '../blog/MsgItem';
import { useState, useEffect } from 'react';
import { PersonalBlogFeedItem } from '../blog/feed/FeedItem';
import { loginMapStateToProps } from 'pages/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/layout/BaseLayout';
import { CallRelay, CallRelayType } from 'service/worker/type';
import {
  Event,
  EventSetMetadataContent,
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

import BasicTabs from 'components/layout/SimpleTabs';

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

export interface ContactInfo {
  created_at: number;
  list: ContactList;
  keys: string[];
}

type UserParams = {
  publicKey: PublicKey;
}

export const ProfilePage = ({ isLoggedIn, signEvent }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { publicKey } = router.query as UserParams;
  const myPublicKey = useReadonlyMyPublicKey();
  const [msgList, setMsgList] = useState<Event[]>([]);
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactList, setMyContactList] = useState<ContactInfo>();
  const [userContactList, setUserContactList] = useState<ContactInfo>();
  const [articles, setArticles] = useState<Article[]>([]);

  const { worker, newConn } = useCallWorker();

  function handleEvent(event: Event, relayUrl?: string) {
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
            worker
              ?.subMetadata(newPks, false, undefined, {
                type: CallRelayType.single,
                data: [relayUrl!],
              })
              ?.iterating({ cb: handleEvent });
          }
        }
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

            const list = new Map();
            for (const t of event.tags.filter(
              t => t[0] === EventTags.P,
            ) as EventContactListPTag[]) {
              list.set(t[1], {
                relayUrl: t[2],
                name: t[3],
              });
            }

            return {
              keys,
              created_at: event.created_at,
              list,
            };
          });
        }

        if (event.pubkey === publicKey) {
          setUserContactList(prev => {
            if (prev && prev?.created_at >= event.created_at) {
              return prev;
            }

            const keys = (
              event.tags.filter(
                t => t[0] === EventTags.P,
              ) as EventContactListPTag[]
            ).map(t => t[1]);
            const list = new Map();
            for (const t of event.tags.filter(
              t => t[0] === EventTags.P,
            ) as EventContactListPTag[]) {
              list.set(t[1], {
                relayUrl: t[2],
                name: t[3],
              });
            }
            return {
              keys,
              created_at: event.created_at,
              list,
            };
          });
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

  useEffect(() => {
    // todo: validate publicKey
    if (publicKey && publicKey.length === 0) return;
    if (newConn.length === 0) return;

    const pks = [publicKey ];
    if (isLoggedIn && myPublicKey.length > 0) {
      pks.push(myPublicKey);
    }

    const callRelay: CallRelay = {
      type: CallRelayType.batch,
      data: newConn,
    };
    worker
      ?.subContactList(pks, undefined, undefined, callRelay)
      ?.iterating({ cb: handleEvent });
    worker
      ?.subMetadata(pks, undefined, undefined, callRelay)
      ?.iterating({ cb: handleEvent });
    worker
      ?.subMsg([publicKey ], undefined, undefined, callRelay)
      ?.iterating({ cb: handleEvent });
    worker
      ?.subNip23Posts({ pks: [publicKey ], callRelay })
      ?.iterating({ cb: handleEvent });
  }, [newConn]);

  const dateBooks = useDateBookData(articles);

  const followUser = async () => {
    if (signEvent == null) {
      return alert('no sign method!');
    }
    if (!myContactList) return;

    const pks = myContactList.keys;
    if (pks.length === 0) {
      const isConfirmed = window.confirm(
        'hey you have 0 followings, are you sure to continue? \n\n(if you think 0 followings is a wrong, please click CANCEL and try again, otherwise you might lost all your following!)',
      );
      if (!isConfirmed) {
        return;
      }
    }
    const tags = pks.map(
      pk =>
        [
          EventTags.P,
          pk,
          myContactList.list.get(pk)?.relayer ?? '',
          myContactList.list.get(pk)?.name ?? '',
        ] as EventContactListPTag,
    );
    tags.push([EventTags.P, publicKey , '', '']);
    if (tags.length != pks.length + 1) {
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
    if (!myContactList) return;

    const pks = myContactList.keys;
    if (pks.length === 0) {
      const isConfirmed = window.confirm(
        'hey you have 0 followings, are you sure to continue? \n\n(if you think 0 followings is a wrong, please click CANCEL and try again, otherwise you might lost all your following!)',
      );
      if (!isConfirmed) {
        return;
      }
    }
    const tags = pks
      .filter(pk => pk !== publicKey)
      .map(
        pk =>
          [
            EventTags.P,
            pk,
            myContactList.list.get(pk)?.relayer ?? '',
            myContactList.list.get(pk)?.name ?? '',
          ] as EventContactListPTag,
      );
    if (tags.length != pks.length - 1) {
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
  const isFollowed =
    isLoggedIn && myContactList && myContactList?.keys.includes(publicKey );
  const followOrUnfollowOnClick = isFollowed ? unfollowUser : followUser;

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
            onClick={() => router.push({ pathname: `${Paths.blog}/${publicKey}`})}
          >
            {"go to the user's blog page"}
          </Button>
        </div>
        {articles.map((a, key) => (
          <PersonalBlogFeedItem
            key={key}
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
            isFollowed={isFollowed}
            followOrUnfollowOnClick={followOrUnfollowOnClick}
            metadata={userMap.get(publicKey )}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <CommitCalendar pk={publicKey } />
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
          {dateBooks.map((book, key) => (
            <div
              key={key}
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
            .map((dir, key) => (
              <div
                key={key}
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
              .map((t, key) => (
                <TagItem key={key} tag={t as string} />
              ))}
          </div>
        </div>
      </Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(ProfilePage);

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
})

export const getStaticPaths = () => ({ paths: [], fallback: true }); 