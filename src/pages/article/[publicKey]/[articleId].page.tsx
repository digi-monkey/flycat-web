import { Grid } from '@mui/material';
import { Paths } from 'constants/path';
import { UserMap } from 'service/type';
import { CopyText } from 'components/CopyText/CopyText';
import { useRouter } from 'next/router';
import { useTimeSince } from 'hooks/useTimeSince';
import { ShareArticle } from 'components/layout/msg/Share';
import { CallRelayType } from 'service/worker/type';
import { useTranslation } from 'next-i18next';
import { useCallWorker } from 'hooks/useWorker';
import { useEffect, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/layout/BaseLayout';
import {
Event,
Filter,
WellKnownEventKind,
  EventSetMetadataContent,
} from 'service/api';
import {
  Flycat,
  ArticleDataSchema,
  ArticlePageContentSchema,
  FlycatWellKnownEventKind,
  SiteMetaDataContentSchema,
  validateArticlePageKind,
} from 'service/flycat-protocol';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

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

// don't move to useState inside components
// it will trigger more times unnecessary
let siteMetaDataEvent: Event;
let articlePageEvent: Event;

type ArticleParams = {
  articleId: string;
  publicKey: string;
}

export default function ArticleRead() {
  const { t } = useTranslation();
  const { publicKey = '', articleId } = useRouter().query as ArticleParams;

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [article, setArticle] = useState<ArticleDataSchema>();
  const [siteMetaData, setSiteMetaData] = useState<SiteMetaDataContentSchema>();
  const [comments, setComments] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    alert('not supported');
  };

  const { worker, newConn, wsConnectStatus } = useCallWorker();

  function handleEvent(event: Event) {
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
      const ap = Flycat.deserialize(event.content) as ArticlePageContentSchema;
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
          console.log(article);
          setArticle(article);
        }
      }
      return;
    }
  }

  const onSubmitShare = (event: Event) => {
    console.log('pub share event: ', event);
    worker?.pubEvent(event);
  };

  const shareUrl = () => {
    // next.js server window is not defined
    if (typeof window === 'undefined') return '';

    return (
      ' ' +
      window.location.protocol +
      '//' +
      window.location.host +
      '/article/' +
      publicKey +
      '/' +
      articleId
    );
  };

  useEffect(() => {
    if (newConn.length === 0) return;

    worker
      ?.subMetadata([publicKey ], undefined, undefined, {
        type: CallRelayType.batch,
        data: newConn,
      })
      ?.iterating({ cb: handleEvent });
    worker
      ?.subBlogSiteMetadata([publicKey ], undefined, undefined, {
        type: CallRelayType.batch,
        data: newConn,
      })
      ?.iterating({ cb: handleEvent });
  }, [newConn, publicKey]);

  const subArticlePages = async (siteMetaData: SiteMetaDataContentSchema) => {
    const filter: Filter = {
      authors: [publicKey],
      kinds: siteMetaData.page_ids.map(
        id => FlycatWellKnownEventKind.SiteMetaData + id,
      ),
      limit: 50,
    };
    worker?.subFilter(filter)?.iterating({ cb: handleEvent });
  };
  
  useEffect(() => {
    if (siteMetaData) {
      subArticlePages(siteMetaData);
    }
  }, [wsConnectStatus, siteMetaData]);

  return (
    <BaseLayout>
      <Left>
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
                <div>
                  {siteMetaData?.site_name}
                  {t('articleRead.article')}
                </div>
              </Grid>
              <Grid item xs={8}>
                <div>
                  <span
                    style={{
                      float: 'right',
                      padding: '0px 5px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setIsShareModalOpen(true)}
                  >
                    {t('articleRead.rePostShare')}
                  </span>
                  <ShareArticle
                    suffix={' ' + shareUrl()}
                    url={shareUrl()}
                    title={article?.title}
                    blogName={siteMetaData?.site_name || ''}
                    blogAvatar={userMap.get(publicKey)?.picture}
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    pk={publicKey}
                    id={articleId}
                    onSubmit={onSubmitShare}
                  />
                  <span style={{ float: 'right' }}>
                    <CopyText
                      name={'🔗'}
                      textToCopy={shareUrl()}
                      successMsg={'Link copied to clipboard!'}
                    />
                  </span>
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
                  <Link href={Paths.user + publicKey}>
                    <span style={{ marginRight: '5px' }}>
                      {userMap.get(publicKey)?.name}
                    </span>
                  </Link>
                  {useTimeSince(article?.created_at || 0) + ' '}
                  {t('articleRead.post')}
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
                  img: ({ node, ...props }) => (
                    <img style={{ width: '100%' }} {...props} />
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
                  <Link href={Paths.user + publicKey}>
                    {userMap.get(publicKey)?.name}
                  </Link>
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
                {t('articleRead.lastUpdatedAt') + ' '}
                {useTimeSince(article?.updated_at ?? 10000)}
              </span>
              <span
                style={{
                  margin: '0px 5px',
                  fontSize: '14px',
                  color: 'gray',
                  float: 'right',
                  cursor: 'pointer',
                }}
                onClick={() => setIsShareModalOpen(true)}
              >
                <span>{t('articleRead.rePostShare')}</span>
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
              <button type="submit">{t('articleRead.submit')}</button>
            </form>
          </div>
        </div>
      </Left>
      <Right>
        <div style={styles.userProfileName}>
          {siteMetaData?.site_name || t('util.unknown')}
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
      </Right>
    </BaseLayout>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
});

export const getStaticPaths = () => ({ paths: [], fallback: true });
