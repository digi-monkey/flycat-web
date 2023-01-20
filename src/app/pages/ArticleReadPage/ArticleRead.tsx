import React, { useEffect, useState } from 'react';
import {
  ArticleDataSchema,
  ArticlePageContentSchema,
  Flycat,
  FlycatWellKnownEventKind,
  SiteMetaDataContentSchema,
  validateArticlePageKind,
} from 'service/flycat-protocol';
import { timeSince } from 'utils/helper';
import {
  Event,
  EventSetMetadataContent,
  EventSubResponse,
  Filter,
  isEventSubResponse,
  WellKnownEventKind,
} from 'service/api';
import ReactMarkdown from 'react-markdown';
import { useParams } from 'react-router-dom';
import { CallWorker } from 'service/worker/callWorker';
import { FromWorkerMessageData, WsConnectStatus } from 'service/worker/type';
import { UserMap } from 'service/type';
import { Grid } from '@mui/material';
import NavHeader from 'app/components/layout/NavHeader';
import { styles } from '../HomePage';
import LoginForm from '../HomePage/LoginForm';
import RelayManager from '../HomePage/RelayManager';

// don't move to useState inside components
// it will trigger more times unnecessary
let siteMetaDataEvent: Event;
let articlePageEvent: Event;

interface UserParams {
  publicKey: string;
  articleId: string;
}

export function ArticleRead() {
  const { articleId, publicKey } = useParams<UserParams>();

  const [wsConnectStatus, setWsConnectStatus] = useState<WsConnectStatus>(
    new Map(),
  );
  const [worker, setWorker] = useState<CallWorker>();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [article, setArticle] = useState<ArticleDataSchema>();
  const [siteMetaData, setSiteMetaData] = useState<SiteMetaDataContentSchema>();
  const [comments, setComments] = useState('');

  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    alert('not supported还没做');
  };

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

        // set new article
        for (const article of ap.data) {
          if (
            article.id.toString() === articleId &&
            (articlePageEvent == null ||
              event.created_at > articlePageEvent.created_at)
          ) {
            articlePageEvent = event;
            setArticle(article);
          }
        }
        return;
      }
    }
  }

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
  return (
    <div style={styles.root}>
      <NavHeader />

      <div style={styles.content}>
        <Grid container>
          <Grid item xs={8} style={styles.left}>
            <div
              style={{
                overflow: 'auto',
                padding: '0px',
                border: '0px',
              }}
            >
              <div
                style={{
                  width: '100%',
                  background: '#F7F5EB',
                  padding: '5px',
                }}
              >
                <Grid container style={{ color: 'gray', fontSize: '12px' }}>
                  <Grid item xs={4}>
                    <div>{siteMetaData?.site_name}的文章</div>
                  </Grid>
                  <Grid item xs={8}>
                    <div>
                      <span style={{ float: 'right', padding: '0px 5px' }}>
                        收藏
                      </span>
                      <span style={{ float: 'right', padding: '0px 5px' }}>
                        分享
                      </span>
                      <span style={{ float: 'right', padding: '0px 5px' }}>
                        转发
                      </span>
                      <span
                        style={{
                          float: 'right',
                          padding: '0px 5px',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            window.location +
                              '/article/' +
                              publicKey +
                              '/' +
                              articleId,
                          );
                          const msg = document.getElementById('copy-msg');
                          if (msg) {
                            msg.style.display = 'block';
                            setTimeout(function () {
                              msg.style.display = 'none';
                            }, 2000);
                          }
                        }}
                      >
                        🔗
                      </span>
                      <div
                        id="copy-msg"
                        style={{
                          display: 'none',
                          background: 'green',
                          color: 'white',
                          padding: '5px',
                          position: 'absolute',
                          top: '0',
                          right: '0',
                        }}
                      >
                        Link copied to clipboard!
                      </div>
                    </div>
                  </Grid>
                </Grid>
              </div>
              <div
                style={{
                  padding: '20px',
                  margin: '0px 0 0 0',
                  background: 'white',
                }}
              >
                <div>
                  <div style={{ margin: '10px 0px 40px 0px' }}>
                    <div style={{ fontSize: '25px', margin: '10px 0px' }}>
                      {article?.title}
                    </div>
                    <div
                      style={{
                        color: 'gray',
                        fontSize: '12px',
                        margin: '5px 0px 10px 0px',
                      }}
                    >
                      <a href={'/user/' + publicKey}>
                        <span style={{ marginRight: '5px' }}>
                          {userMap.get(publicKey)?.name}
                        </span>
                      </a>
                      {timeSince(article?.created_at ?? 10000)}发表
                    </div>
                  </div>

                  <ReactMarkdown
                    className="heti heti--classic"
                    components={{
                      h1: ({ node, ...props }) => (
                        <div
                          style={{ fontSize: '20px', fontWeight: '500px' }}
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <div
                          style={{ fontSize: '18px', fontWeight: '500px' }}
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <div
                          style={{ fontSize: '16px', fontWeight: '500px' }}
                          {...props}
                        />
                      ),
                      h4: ({ node, ...props }) => (
                        <div
                          style={{ fontSize: '14px', fontWeight: '500px' }}
                          {...props}
                        />
                      ),
                    }}
                  >
                    {article?.content ?? ''}
                  </ReactMarkdown>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '80px 20px',
                  }}
                >
                  <div style={{ textAlign: '-webkit-center' as any }}>
                    <img
                      src={userMap.get(publicKey)?.picture}
                      alt=""
                      style={{
                        width: '80px',
                        height: '80px',
                        display: 'block',
                      }}
                    />
                    <h3>{siteMetaData?.site_name}</h3>
                    <span style={{ fontSize: '14px', color: 'gray' }}>
                      {siteMetaData?.site_description}
                    </span>
                    <br />
                    <br />
                    <span>
                      <a href={'/user/' + publicKey}>
                        {userMap.get(publicKey)?.name}
                      </a>
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: '80px', marginBottom: '20px' }}>
                  <span
                    style={{
                      margin: '0px 5px',
                      fontSize: '14px',
                      color: 'gray',
                    }}
                  >
                    上次更新
                    {timeSince(article?.updated_at ?? 10000)}
                  </span>
                  <span
                    style={{
                      margin: '0px 5px',
                      fontSize: '14px',
                      color: 'gray',
                      float: 'right',
                    }}
                  >
                    <span>点赞</span>
                  </span>
                  <span
                    style={{
                      margin: '0px 5px',
                      fontSize: '14px',
                      color: 'gray',
                      float: 'right',
                    }}
                  >
                    <span>转发</span>
                  </span>
                </div>
              </div>
              <div
                style={{
                  width: '100%',
                  minHeight: '100px',
                  height: '100%',
                  background: '#ECECEC',
                  padding: '20px',
                }}
              >
                <form onSubmit={handleCommentSubmit}>
                  <textarea
                    style={{ width: '100%', height: '68px', padding: '5px' }}
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                  />
                  <button type="submit">发布</button>
                </form>
              </div>
            </div>
          </Grid>
          <Grid item xs={4} style={styles.right}>
            <div style={styles.userProfileName}>
              {siteMetaData?.site_name || '未知'}
            </div>
            <div
              style={{
                fontSize: '14px',
                color: 'gray',
                marginTop: '5px',
              }}
            >
              {siteMetaData?.site_description}
            </div>

            <hr />
            <LoginForm />
            <hr />
            <RelayManager />
          </Grid>
        </Grid>
      </div>
    </div>
  );
}
