import React, { useState, useEffect } from 'react';
import {
  EventSubResponse,
  EventSetMetadataContent,
  Filter,
  isEventSubResponse,
  WellKnownEventKind,
  PublicKey,
  PrivateKey,
  RelayUrl,
  PetName,
  Event,
} from 'service/api';
import { connect, useSelector } from 'react-redux';
import RelayManager from '../../components/layout/relay/RelayManager';
import { useParams } from 'react-router-dom';
import {
  ArticleDataSchema,
  ArticlePageContentSchema,
  Flycat,
  FlycatWellKnownEventKind,
  SiteMetaDataContentSchema,
  validateArticlePageKind,
} from 'service/flycat-protocol';
import { SiteMeta } from './SiteMeta';
import PostArticle, { ArticlePostForm } from './PostArticle';
import { FromWorkerMessageData, WsConnectStatus } from 'service/worker/type';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import { UserBlogHeader } from 'app/components/layout/UserBox';
import { ArticleMsg } from 'app/components/layout/msg/ArticleMsg';
import { equalMaps } from 'service/helper';
import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { RootState } from 'store/configureStore';

// don't move to useState inside components
// it will trigger more times unnecessary
let siteMetaDataEvent: Event;

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

interface UserParams {
  publicKey: PublicKey;
}

export const BlogPage = () => {
  const { publicKey } = useParams<UserParams>();

  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );

  const myPublicKey = useReadonlyMyPublicKey();

  const [wsConnectStatus, setWsConnectStatus] = useState<WsConnectStatus>(
    new Map(),
  );

  const isOwner = myPublicKey === publicKey;
  const [siteMetaData, setSiteMetaData] = useState<SiteMetaDataContentSchema>();
  const [articles, setArticles] = useState<
    (ArticleDataSchema & { page_id: number })[]
  >([]);
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [worker, setWorker] = useState<CallWorker>();

  const flycat = new Flycat({
    version: '',
  });

  function onMsgHandler(res: any) {
    const msg = JSON.parse(res);
    if (isEventSubResponse(msg)) {
      const event = (msg as EventSubResponse)[2];

      if (event.pubkey !== publicKey) {
        return;
      }

      if (event.kind === WellKnownEventKind.set_metadata) {
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
        return;
      }

      if (event.kind === WellKnownEventKind.flycat_site_metadata) {
        if (
          siteMetaDataEvent == null ||
          siteMetaDataEvent.created_at < event.created_at
        ) {
          const data = Flycat.deserialize(
            event.content,
          ) as SiteMetaDataContentSchema;
          siteMetaDataEvent = event;
          setSiteMetaData(data);
        }
        return;
      }

      if (validateArticlePageKind(event.kind)) {
        const ap = Flycat.deserialize(
          event.content,
        ) as ArticlePageContentSchema;
        if (ap.article_ids.length !== ap.data.length) {
          throw new Error('unexpected data');
        }

        // set new articles
        setArticles(oldArray => {
          let updatedArray = [...oldArray];

          // check if there is old article updated
          for (const newItem of ap.data) {
            let index = updatedArray.findIndex(item => item.id === newItem.id);
            if (index !== -1) {
              if (newItem.updated_at > updatedArray[index].updated_at) {
                updatedArray[index] = {
                  ...newItem,
                  ...{ page_id: updatedArray[index].page_id },
                };
              }
            }
          }

          // check if there is new article added
          const newData: (ArticleDataSchema & { page_id: number })[] = [];
          for (const a of ap.data) {
            if (!updatedArray.map(o => o.id).includes(a.id)) {
              newData.push({ ...a, ...{ page_id: ap.page_id } });
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
    }
  }

  function _wsConnectStatus() {
    return wsConnectStatus;
  }

  useEffect(() => {
    const worker = new CallWorker(
      (message: FromWorkerMessageData) => {
        if (message.wsConnectStatus) {
          if (equalMaps(_wsConnectStatus(), message.wsConnectStatus)) {
            // no changed
            console.debug('[wsConnectStatus] same, not updating');
            return;
          }

          const data = Array.from(message.wsConnectStatus.entries());
          setWsConnectStatus(prev => {
            const newMap = new Map(prev);
            for (const d of data) {
              const relayUrl = d[0];
              const isConnected = d[1];
              if (
                newMap.get(relayUrl) &&
                newMap.get(relayUrl) === isConnected
              ) {
                continue; // no changed
              }

              newMap.set(relayUrl, isConnected);
            }

            return newMap;
          });
        }
      },
      (message: FromWorkerMessageData) => {
        onMsgHandler(message.nostrData);
      },
    );
    setWorker(worker);
    worker.pullWsConnectStatus();
  }, []);

  useEffect(() => {
    worker?.subMetadata([publicKey]);
    worker?.subBlogSiteMetadata([publicKey]);
  }, [wsConnectStatus, publicKey]);

  useEffect(() => {
    if (siteMetaData) {
      subArticlePages(siteMetaData);
    }
  }, [wsConnectStatus, siteMetaData]);

  const subArticlePages = async (siteMetaData: SiteMetaDataContentSchema) => {
    const filter: Filter = {
      authors: [publicKey],
      kinds: siteMetaData.page_ids.map(
        id => FlycatWellKnownEventKind.SiteMetaData + id,
      ),
      limit: 50,
    };
    worker?.subFilter(filter);
  };

  const submitSiteMetaData = async (name: string, description: string) => {
    if (signEvent == null) {
      return alert('no sign method!');
    }

    const rawEvent = await flycat.newSite({ name, description });
    const event = await signEvent(rawEvent);
    worker?.pubEvent(event);

    // refresh blog data
    worker?.subBlogSiteMetadata([publicKey]);
  };

  const submitArticle = async (form: ArticlePostForm) => {
    if (signEvent == null) {
      return alert('no sign method!');
    }

    const articleDataSchema = flycat.newArticleData(form);
    const duplicatedArray = articles.map(a => a.page_id);
    const pageIds = duplicatedArray.filter(
      (item, index) => duplicatedArray.indexOf(item) === index,
    );

    let pageId: number;
    if (pageIds.length > 0) {
      // get last page id
      const lastPageId = pageIds[pageIds.length - 1];
      if (Flycat.isPageFull(lastPageId, articles)) {
        pageId = lastPageId + 1; // use new page
      } else {
        pageId = lastPageId; // append to the last page
      }
    } else {
      pageId = 1; // create first new page
    }

    const ap = flycat.newArticlePageContent(pageId, [
      ...articles,
      { ...articleDataSchema, ...{ page_id: pageId } },
    ]);
    const apRawEvent = await flycat.updateArticlePage(ap);
    const apEvent = await signEvent(apRawEvent);
    worker?.pubEvent(apEvent);

    // remember to update the site metadata with new page id
    if (!siteMetaData?.page_ids.includes(pageId)) {
      const newPageIds = siteMetaData?.page_ids.concat(pageId);
      const metaData = { ...siteMetaData, ...{ page_ids: newPageIds } };
      const rawSiteEvent = await flycat.updateSite(
        metaData as SiteMetaDataContentSchema,
      );
      const siteEvent = await signEvent(rawSiteEvent);
      worker?.pubEvent(siteEvent);
    }

    // refresh
    if (siteMetaData) {
      subArticlePages(siteMetaData);
      alert("if you don't see it, refresh the page. sorry, will fix it soon");
    }
  };

  const submitUpdateArticle = async (
    article: ArticleDataSchema & { page_id: number },
  ) => {
    if (signEvent == null) {
      return alert('no sign method!');
    }
    const pageData = articles
      .filter(a => a.page_id === article.page_id)
      .map(a => {
        const ar: ArticleDataSchema = {
          id: a.id,
          title: a.title,
          content_size: a.content_size,
          content: a.content,
          created_at: a.created_at,
          updated_at: a.updated_at,
        };
        return ar;
      })
      .map(a => {
        if (a.id === article.id) {
          const updateArticle: ArticleDataSchema = {
            id: article.id,
            title: article.title,
            content_size: article.content_size,
            content: article.content,
            created_at: article.created_at,
            updated_at: article.updated_at,
          };
          return updateArticle;
        } else {
          return a;
        }
      });
    const articlePage: ArticlePageContentSchema = {
      page_id: article.page_id,
      count: pageData.length,
      article_ids: pageData.map(a => a.id),
      data: pageData,
    };

    const rawEvent = await flycat.updateArticlePage(articlePage);
    const event = await signEvent(rawEvent);
    worker?.pubEvent(event);
  };

  return (
    <BaseLayout>
      <Left>
        <UserBlogHeader
          pk={publicKey}
          avatar={userMap.get(publicKey)?.picture}
          name={userMap.get(publicKey)?.name}
          siteName={siteMetaData?.site_name}
          siteDescription={siteMetaData?.site_description}
        />
        <div style={styles.message}>
          {isOwner && siteMetaData && (
            <>
              <PostArticle onSubmit={submitArticle} />
            </>
          )}
          <ul style={styles.msgsUl}>
            {articles.map((article, index) => (
              <ArticleMsg
                key={article.id}
                isOwner={isOwner}
                author={userMap.get(publicKey)!}
                publicKey={publicKey}
                siteMetaData={siteMetaData!}
                article={article}
                submitUpdateArticle={submitUpdateArticle}
                subArticlePages={subArticlePages}
              />
            ))}
          </ul>
        </div>
      </Left>
      <Right>
        <div>
          <SiteMeta
            isOwner={isOwner}
            siteMetaData={siteMetaData}
            onSubmit={submitSiteMetaData}
          />
        </div>
        <hr />
        <RelayManager />
      </Right>
    </BaseLayout>
  );
};
export default BlogPage;
