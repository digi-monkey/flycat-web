import { Grid } from '@mui/material';
import NavHeader from 'app/components/layout/NavHeader';
import RelayManager from 'app/components/layout/RelayManager';
import { BlogMsg } from 'app/components/layout/TextMsg';
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
} from 'service/api';
import {
  SiteMetaDataContentSchema,
  ArticleDataSchema,
  FlycatWellKnownEventKind,
  Flycat,
  validateArticlePageKind,
  ArticlePageContentSchema,
} from 'service/flycat-protocol';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import { FromWorkerMessageData, WsConnectStatus } from 'service/worker/type';
import { ContactList, KeyPair } from '.';

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

export const BlogFeed = ({ isLoggedIn, myPublicKey, myPrivateKey }) => {
  const { t } = useTranslation();
  const [wsConnectStatus, setWsConnectStatus] = useState<WsConnectStatus>(
    new Map(),
  );
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactList, setMyContactList] = useState<ContactList>(new Map());
  const [myKeyPair, setMyKeyPair] = useState<KeyPair>({
    publicKey: myPublicKey,
    privateKey: myPrivateKey,
  });
  const [worker, setWorker] = useState<CallWorker>();
  const [siteMetaData, setSiteMetaData] = useState<
    (SiteMetaDataContentSchema & { pk: string; created_at: number })[]
  >([]);
  const [articles, setArticles] = useState<
    (ArticleDataSchema & { pk: PublicKey; pageCreatedAt: number })[]
  >([]);

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
    worker.pullWsConnectStatus();

    return () => {
      worker.removeListeners();
    };
  }, []);

  function onMsgHandler(res: any) {
    const msg = JSON.parse(res);
    if (isEventSubResponse(msg)) {
      const event = (msg as EventSubResponse)[2];
      const contacts = myContactEvent
        ? (myContactEvent.tags
            .filter(t => t[0] === EventTags.P)
            .map(t => t[1]) as PublicKey[])
        : [];
      const isSubEvent = contacts.concat(myPublicKey).includes(event.pubkey);
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
          if (event.pubkey === myKeyPair.publicKey) {
            if (
              myContactEvent == null ||
              myContactEvent?.created_at! < event.created_at
            ) {
              myContactEvent = event;
            }
          }
          break;

        case FlycatWellKnownEventKind.SiteMetaData:
          if (isSubEvent) {
            setSiteMetaData(prev => {
              const newMap = prev;
              const oldData = prev.filter(s => s.pk === event.pubkey);
              if (
                oldData.length > 0 &&
                oldData[0].created_at > event.created_at
              ) {
                // the new data is outdated
                return prev;
              }

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
              return newMap;
            });
          }
          break;

        default:
          if (
            validateArticlePageKind(event.kind) &&
            isSubEvent &&
            event.content.length > 0
          ) {
            setArticles(pre => {
              const newData = pre;
              const oldData = pre.filter(p => p.pk === event.pubkey);
              if (
                oldData.length > 0 &&
                oldData[0].pageCreatedAt >= event.created_at
              ) {
                // outdate
                return pre;
              }

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
    if (isLoggedIn !== true) return;

    setMyKeyPair({
      publicKey: myPublicKey,
      privateKey: myPrivateKey,
    });
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn !== true) return;
    if (myKeyPair.publicKey == null) return;

    worker?.subMetadata([myKeyPair.publicKey]);
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
    if (myContactList.size > 0) {
      worker?.subMetadata(Array.from(myContactList.keys()));
      worker?.subBlogSiteMetadata(
        Array.from(myContactList.keys()).concat(myPublicKey),
      );
    }
  }, [myContactList]);

  useEffect(() => {
    if (siteMetaData.length > 0) {
      const kinds: number[] = siteMetaData
        .reduce((prev: number[], cur) => prev.concat(cur.page_ids), [])
        .map(id => id + FlycatWellKnownEventKind.SiteMetaData);
      const uniqueKinds = kinds.filter((item, index) => {
        return kinds.indexOf(item) === index;
      });
      const filter: Filter = {
        authors: Array.from(myContactList.keys()).concat(myPublicKey),
        kinds: uniqueKinds,
      };
      worker?.subFilter(filter);
    }
  }, [siteMetaData.length]);

  return (
    <div style={styles.root}>
      <NavHeader />
      <div style={styles.content}>
        <Grid container>
          <Grid item xs={8} style={styles.left}>
            <div style={styles.message}>
              <div>{t('blogFeed.title')}</div>
              <hr />
              <ul style={styles.msgsUl}>
                {articles.length === 0 && (
                  <p style={{ color: 'gray' }}>{t('blogFeed.noPostYet')}</p>
                )}
                {articles.map((a, index) => (
                  <BlogMsg
                    key={index}
                    keyPair={myKeyPair}
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
            <RelayManager />
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default connect(mapStateToProps)(BlogFeed);
