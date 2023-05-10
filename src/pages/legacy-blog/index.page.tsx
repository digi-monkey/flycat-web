import { Paths } from 'constants/path';
import { connect } from 'react-redux';
import { UserMap } from 'service/type';
import { LoginFormTip } from 'components/layout/NavHeader';
import { CallRelayType } from 'service/worker/type';
import { useCallWorker } from 'hooks/useWorker';
import { shortPublicKey } from 'service/helper';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import { loginMapStateToProps } from 'pages/helper';
import { Nip19DataType, Nip19 } from 'service/nip/19';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { BlogMsg, ProfileAvatar } from 'components/layout/msg/TextMsg';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/layout/BaseLayout';
import {
  EventTags,
  Event,
  EventContactListPTag,
  EventSetMetadataContent,
  WellKnownEventKind,
  Filter,
  PublicKey,
} from 'service/api';
import {
  SiteMetaDataContentSchema,
  ArticleDataSchema,
  FlycatWellKnownEventKind,
  Flycat,
  validateArticlePageKind,
  ArticlePageContentSchema,
} from 'service/flycat-protocol';

import Link from 'next/link';

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
  const [myContactList, setMyContactList] =
    useState<{ keys: PublicKey[]; created_at: number }>();

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

  const { worker, newConn, wsConnectStatus } = useCallWorker();

  function handEvent(event: Event, relayUrl?: string) {
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
          setMyContactList(prev => {
            if (prev && prev?.created_at >= event.created_at) {
              return prev;
            }

            const keys = (
              event.tags.filter(
                t => t[0] === EventTags.P,
              ) as EventContactListPTag[]
            ).map(t => t[1]);
            return {
              keys,
              created_at: event.created_at,
            };
          });
        }
        break;

      case FlycatWellKnownEventKind.SiteMetaData:
        if (myContactList?.keys.includes(event.pubkey)) {
          //todo: fix, this is not working
          const oldData = siteMetaData.filter(s => s.pk === event.pubkey);
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

        worker?.subMetadata([event.pubkey])?.iterating({ cb: handEvent });
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
              const updatedArray = [...oldArray];

              // check if there is old article updated
              for (const newItem of ap.data) {
                const index = updatedArray.findIndex(
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

  useEffect(() => {
    if (newConn.length === 0) return;
    if (isLoggedIn !== true) return;
    if (myPublicKey == null) return;

    worker
      ?.subContactList([myPublicKey], undefined, undefined, {
        type: CallRelayType.batch,
        data: newConn,
      })
      ?.iterating({ cb: handEvent });
    worker
      ?.subMetadata([myPublicKey], undefined, undefined, {
        type: CallRelayType.batch,
        data: newConn,
      })
      ?.iterating({ cb: handEvent });
  }, [myPublicKey, newConn]);

  useEffect(() => {
    if (!myContactList) return;

    const pks = myContactList.keys;
    if (myPublicKey.length > 0) {
      pks.push(myPublicKey);
    }

    worker?.subMetadata(pks)?.iterating({ cb: handEvent });
    worker?.subBlogSiteMetadata(pks)?.iterating({ cb: handEvent });
  }, [myContactList]);

  useEffect(() => {
    if (newConn.length === 0) return;
    if (isLoggedIn) return;

    worker
      ?.subMetadata([hardCodedBlogPk], undefined, undefined, {
        type: CallRelayType.batch,
        data: newConn,
      })
      ?.iterating({ cb: handEvent });
    worker
      ?.subBlogSiteMetadata([hardCodedBlogPk], undefined, undefined, {
        type: CallRelayType.batch,
        data: newConn,
      })
      ?.iterating({ cb: handEvent });
  }, [isLoggedIn, newConn]);

  useEffect(() => {
    if (newConn.length === 0) return;
    const globalBlogFilter: Filter = {
      kinds: [WellKnownEventKind.flycat_site_metadata],
      limit: 50,
    };
    worker
      ?.subFilter(globalBlogFilter, true, 'globalBlogSites', {
        type: CallRelayType.batch,
        data: newConn,
      })
      ?.iterating({ cb: handEvent });
  }, [newConn]);
  
  const subArticles = () => {
    const siteMetadata = globalSiteMetaData.filter(
      s =>
        myContactList?.keys.includes(s.pk) ||
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

    worker?.subFilter(filter)?.iterating({ cb: handEvent });
  };

  useEffect(() => {
    if (globalSiteMetaData.length > 0) {
      subArticles();
    }
  }, [isLoggedIn, globalSiteMetaData.length]);

  return (
    <BaseLayout>
      <Left>
        <div style={styles.message}>
          <div>{t('blogFeed.title')} (deprecated)</div>
          <hr />
          <div>
            <p>{globalSiteMetaData.length} Total Blogs Created</p>
            {globalSiteMetaData.map((s, index) => (
              <Link
                href={Paths.legacy_blog + s.pk}
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
                    shortPublicKey(Nip19.encode(s.pk, Nip19DataType.Pubkey))}
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
              </Link>
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
                .filter(
                  a =>
                    myContactList?.keys.includes(a.pk) || a.pk === myPublicKey,
                )
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
      <Right></Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(BlogFeed);

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
})
