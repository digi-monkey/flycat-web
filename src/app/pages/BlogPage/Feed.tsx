import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import { LoginFormTip } from 'app/components/layout/NavHeader';
import RelayManager from 'app/components/layout/relay/RelayManager';
import { BlogMsg, ProfileAvatar } from 'app/components/layout/msg/TextMsg';
import { UserBox, UserRequiredLoginBox } from 'app/components/layout/UserBox';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import {
  EventTags,
  Event,
  EventContactListPTag,
  EventSetMetadataContent,
  EventSubResponse,
  isEventSubResponse,
  WellKnownEventKind,
  Filter,
  PublicKey,
  nip19Encode,
  Nip19DataType,
} from 'service/api';
import {
  SiteMetaDataContentSchema,
  ArticleDataSchema,
  FlycatWellKnownEventKind,
  Flycat,
  validateArticlePageKind,
  ArticlePageContentSchema,
} from 'service/flycat-protocol';
import { equalMaps, shortPublicKey } from 'service/helper';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import {
  CallRelayType,
  FromWorkerMessageData,
  WsConnectStatus,
} from 'service/worker/type';
import { ContactList } from '.';
import defaultAvatar from '../../../resource/logo512.png';
import { loginMapStateToProps } from 'app/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';

// don't move to useState inside components
// it will trigger more times unnecessary
let myContactEvent: Event;

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

// actually this is mine pk, flycat author
// right now few people created blog so can only give mine as an example
const hardCodedBlogPk =
  '45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a';

export const BlogFeed = ({ isLoggedIn }) => {
  const { t } = useTranslation();
  const myPublicKey = useReadonlyMyPublicKey();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactList, setMyContactList] = useState<ContactList>(new Map());

  const [siteMetaData, setSiteMetaData] = useState<
    (SiteMetaDataContentSchema & { pk: string; created_at: number })[]
  >([]);
  const [globalSiteMetaData, setGlobalSiteMetaData] = useState<
    (SiteMetaDataContentSchema & { pk: string; created_at: number })[]
  >([]);
  const [articles, setArticles] = useState<
    (ArticleDataSchema & { pk: PublicKey; pageCreatedAt: number })[]
  >([]);

  const [globalArticles, setGlobalArticles] = useState<
    (ArticleDataSchema & {
      pk: PublicKey;
      page_id: number;
      pageCreatedAt: number;
    })[]
  >([]);

  const updateWorkerMsgListenerDeps = [
    myContactEvent,
    myPublicKey,
    myContactList.size,
  ];
  const { worker, newConn, wsConnectStatus } = useCallWorker({
    onMsgHandler,
    updateWorkerMsgListenerDeps,
  });

  function onMsgHandler(this, res: any, relayUrl?: string) {
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

        case FlycatWellKnownEventKind.SiteMetaData:
          if (myContactList.has(event.pubkey)) {
            //todo: fix, this is not working
            const oldData = siteMetaData.filter(s => s.pk === event.pubkey);
            if (
              oldData.length > 0 &&
              oldData[0].created_at >= event.created_at
            ) {
              // the new data is outdated
              return;
            }

            const newMap = siteMetaData;
            const siteMeta = Flycat.deserialize(
              event.content,
            ) as SiteMetaDataContentSchema;
            const data = {
              ...siteMeta,
              ...{
                created_at: event.created_at,
                pk: event.pubkey,
              },
            };
            if (!newMap.map(a => a.pk).includes(data.pk)) {
              // don't add duplicate one
              newMap.push(data);
            }

            setSiteMetaData(newMap);
          }

          // global blog sites
          const oldData = globalSiteMetaData.filter(s => s.pk === event.pubkey);
          if (oldData.length > 0 && oldData[0].created_at >= event.created_at) {
            // the new data is outdated
            return;
          }

          const newMap = siteMetaData;
          const siteMeta = Flycat.deserialize(
            event.content,
          ) as SiteMetaDataContentSchema;
          const data = {
            ...siteMeta,
            ...{
              created_at: event.created_at,
              pk: event.pubkey,
            },
          };
          if (!newMap.map(a => a.pk).includes(data.pk)) {
            // don't add duplicate one
            newMap.push(data);
          }

          worker?.subMetadata([event.pubkey]);
          setGlobalSiteMetaData(newMap);
          break;

        default:
          if (validateArticlePageKind(event.kind)) {
            if (!isLoggedIn) {
              const ap = Flycat.deserialize(
                event.content,
              ) as ArticlePageContentSchema;
              if (ap.article_ids.length !== ap.data.length) {
                throw new Error('unexpected data');
              }

              // set new articles
              setGlobalArticles(oldArray => {
                let updatedArray = [...oldArray];

                // check if there is old article updated
                for (const newItem of ap.data) {
                  let index = updatedArray.findIndex(
                    item => item.id === newItem.id,
                  );
                  if (index !== -1) {
                    if (newItem.updated_at > updatedArray[index].updated_at) {
                      updatedArray[index] = {
                        ...newItem,
                        ...{
                          page_id: updatedArray[index].page_id,
                          pageCreatedAt: event.created_at,
                          pk: event.pubkey,
                        },
                      };
                    }
                  }
                }

                // check if there is new article added
                const newData: (ArticleDataSchema & {
                  page_id: number;
                  pageCreatedAt: number;
                  pk: PublicKey;
                })[] = [];
                for (const a of ap.data) {
                  if (!updatedArray.map(o => o.id).includes(a.id)) {
                    newData.push({
                      ...a,
                      ...{
                        page_id: ap.page_id,
                        pageCreatedAt: event.created_at,
                        pk: event.pubkey,
                      },
                    });
                  }
                }

                // sort by timestamp
                const unsorted = [...updatedArray, ...newData];
                const sorted = unsorted.sort((a, b) =>
                  a.created_at >= b.created_at ? -1 : 1,
                );
                return sorted;
              });
              return;
            }

            // sign-in
            const oldData = articles.filter(p => p.pk === event.pubkey);
            if (
              oldData.length > 0 &&
              oldData[0].pageCreatedAt >= event.created_at
            ) {
              // outdate
              return;
            }

            setArticles(pre => {
              const newData = pre;
              try {
                const ap = Flycat.deserialize(
                  event.content,
                ) as ArticlePageContentSchema;

                const newArticle: (ArticleDataSchema & {
                  pk: PublicKey;
                  pageCreatedAt: number;
                })[] = [];

                for (const a of ap.data) {
                  const data: ArticleDataSchema & {
                    pk: PublicKey;
                    pageCreatedAt: number;
                  } = {
                    ...a,
                    ...{ pk: event.pubkey, pageCreatedAt: event.created_at },
                  };
                  newArticle.push(data);
                }

                for (const a of newArticle) {
                  if (!newData.map(i => i.id).includes(a.id)) {
                    newData.push(a);
                  }
                }
                if (newData.length > 0) {
                  // sort by timestamp
                  const sorted = newData.sort((a, b) =>
                    a.created_at >= b.created_at ? -1 : 1,
                  );
                  return sorted;
                } else {
                  return pre;
                }
              } catch (error: any) {
                return pre;
              }
            });
          }
          break;
      }
    }
  }

  useEffect(() => {
    if (newConn.length === 0) return;
    if (isLoggedIn !== true) return;
    if (myPublicKey == null) return;

    worker?.subContactList([myPublicKey], undefined, undefined, {
      type: CallRelayType.batch,
      data: newConn,
    });
    worker?.subMetadata([myPublicKey], undefined, undefined, {
      type: CallRelayType.batch,
      data: newConn,
    });
  }, [myPublicKey, newConn]);

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
    if (myContactList.size > 0) {
      const pks = Array.from(myContactList.keys());
      if (myPublicKey.length > 0) {
        pks.push(myPublicKey);
      }

      worker?.subMetadata(pks);
      worker?.subBlogSiteMetadata(pks);
    }
  }, [myContactList]);

  useEffect(() => {
    if (newConn.length === 0) return;
    if (isLoggedIn) return;

    worker?.subMetadata([hardCodedBlogPk], undefined, undefined, {
      type: CallRelayType.batch,
      data: newConn,
    });
    worker?.subBlogSiteMetadata([hardCodedBlogPk], undefined, undefined, {
      type: CallRelayType.batch,
      data: newConn,
    });
  }, [isLoggedIn, newConn]);

  useEffect(() => {
    if (newConn.length === 0) return;
    const globalBlogFilter: Filter = {
      kinds: [WellKnownEventKind.flycat_site_metadata],
      limit: 50,
    };
    worker?.subFilter(globalBlogFilter, true, 'globalBlogSites', {
      type: CallRelayType.batch,
      data: newConn,
    });
  }, [newConn]);

  useEffect(() => {
    if (globalSiteMetaData.length > 0) {
      subArticles();
    }
  }, [isLoggedIn, globalSiteMetaData.length]);

  const subArticles = () => {
    const siteMetadata = globalSiteMetaData.filter(
      s =>
        myContactList.has(s.pk) ||
        s.pk === myPublicKey ||
        s.pk === hardCodedBlogPk,
    );
    const kinds: number[] = siteMetadata
      .reduce((prev: number[], cur) => prev.concat(cur.page_ids), [])
      .map(id => id + FlycatWellKnownEventKind.SiteMetaData);
    const uniqueKinds = kinds.filter((item, index) => {
      return kinds.indexOf(item) === index;
    });

    if (uniqueKinds.length === 0) return;

    const authors = siteMetaData.map(s => s.pk);
    if (myPublicKey.length > 0 && !authors.includes(myPublicKey)) {
      authors.push(myPublicKey);
    }
    if (!isLoggedIn) {
      authors.push(hardCodedBlogPk);
    }

    const filter: Filter = {
      authors: authors,
      kinds: uniqueKinds,
    };

    worker?.subFilter(filter);
  };

  return (
    <BaseLayout>
      <Left>
        <div style={styles.message}>
          <div>{t('blogFeed.title')}</div>
          <hr />
          <div>
            <p>{globalSiteMetaData.length} Total Blogs Created</p>
            {globalSiteMetaData.map((s, index) => (
              <a
                href={'/blog/' + s.pk}
                target="_blank"
                style={{
                  textDecoration: 'none',
                  display: 'block',
                  marginTop: '5px',
                  border: '1px dotted gray',
                }}
                key={s.pk}
                rel="noreferrer"
              >
                <span>
                  <ProfileAvatar
                    style={{ width: '48px', height: '48px' }}
                    name={s.pk}
                    picture={userMap.get(s.pk)?.picture}
                  />
                </span>
                <span> {s.site_name || '__'}</span>
                <span style={{ fontSize: '12px', color: 'gray' }}>
                  {' by '}
                  {userMap.get(s.pk)?.name ||
                    shortPublicKey(nip19Encode(s.pk, Nip19DataType.Pubkey))}
                </span>
                <span
                  style={{
                    display: 'block',
                    color: 'gray',
                    margin: '10px 5px',
                  }}
                >
                  {s.site_description}
                </span>
              </a>
            ))}
          </div>
          <hr />
          <ul style={styles.msgsUl}>
            {articles.length === 0 && !isLoggedIn && (
              <div>
                <p style={{ color: 'gray' }}>
                  {t('UserRequiredLoginBox.loginFirst')} <LoginFormTip />
                </p>
                <hr />
                <p style={{ color: 'gray', fontSize: '14px' }}>
                  {t('blogFeed.globalFeed')}
                </p>
                {globalArticles.map((a, index) => (
                  <BlogMsg
                    key={a.pk + a.id}
                    name={userMap.get(a.pk)?.name}
                    avatar={userMap.get(a.pk)?.picture}
                    pk={a.pk}
                    title={a.title}
                    blogName={
                      siteMetaData.filter(s => s.pk === a.pk)[0]?.site_name
                    }
                    articleId={a.id?.toString()}
                    createdAt={a.created_at}
                    onSubmitShare={(e: Event) => worker?.pubEvent(e)}
                  />
                ))}
              </div>
            )}
            {articles.length === 0 && isLoggedIn && (
              <div>
                <p style={{ color: 'gray' }}>{t('blogFeed.noPostYet')}</p>
                <p style={{ color: 'gray' }}>{t('blogFeed.followHint')}</p>
              </div>
            )}
            {articles.length > 0 && <p>Your following</p>}
            {articles.length > 0 &&
              isLoggedIn &&
              // todo: fix the filter hack
              articles
                .filter(a => myContactList.has(a.pk) || a.pk === myPublicKey)
                .map((a, index) => (
                  <BlogMsg
                    key={a.pk + a.id}
                    name={userMap.get(a.pk)?.name}
                    avatar={userMap.get(a.pk)?.picture}
                    pk={a.pk}
                    title={a.title}
                    blogName={
                      siteMetaData.filter(s => s.pk === a.pk)[0]?.site_name
                    }
                    articleId={a.id?.toString()}
                    createdAt={a.created_at}
                    onSubmitShare={(e: Event) => worker?.pubEvent(e)}
                  />
                ))}
          </ul>
        </div>
      </Left>
      <Right>
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
      </Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(BlogFeed);
