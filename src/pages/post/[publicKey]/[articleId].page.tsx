import { UserMap } from 'core/nostr/type';
import { useRouter } from 'next/router';
import { CallRelayType } from 'core/worker/type';
import { useCallWorker } from 'hooks/useWorker';
import { callSubFilter } from 'core/backend/sub';
import { useTranslation } from 'next-i18next';
import { Article, Nip23 } from 'core/nip/23';
import { Nip08, RenderFlag } from 'core/nip/08';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { useEffect, useMemo, useState } from 'react';
import { EventSetMetadataContent, WellKnownEventKind } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { toTimeString } from './util';

import styles from './index.module.scss';
import Head from 'next/head';
import PostContent from './PostContent';
import PostReactions from 'components/PostItems/PostReactions';
import Link from 'next/link';
import { Paths } from 'constants/path';
import { payLnUrlInWebLn } from 'core/lighting/lighting';
import Icon from 'components/Icon';
import { Button, Input } from 'antd';
import Comments from 'components/Comments';

type UserParams = {
  publicKey: string;
  articleId: string;
};

export default function NewArticle({ preArticle }: { preArticle?: Article }) {
  const { t } = useTranslation();
  const query = useRouter().query as UserParams;
  const { publicKey } = query;
  const articleId = decodeURIComponent(query.articleId);
  const { worker, newConn } = useCallWorker();

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [article, setArticle] = useState<Article>();
  const [articleEvent, setArticleEvent] = useState<Event>();

  function handleEvent(event: Event, relayUrl?: string) {
    if (event.kind === WellKnownEventKind.set_metadata) {
      const metadata: EventSetMetadataContent = JSON.parse(event.content);
      setUserMap(prev => {
        const newMap = new Map(prev);
        const oldData = newMap.get(event.pubkey);
        if (oldData && oldData.created_at > event.created_at) return newMap;

        newMap.set(event.pubkey, {
          ...metadata,
          ...{ created_at: event.created_at },
        });
        return newMap;
      });
      return;
    }

    if (event.kind === WellKnownEventKind.long_form) {
      if (event.pubkey !== publicKey) return;
      const article = Nip23.toArticle(event);
      setArticle(prevArticle => {
        if (!prevArticle || article?.updated_at >= prevArticle.updated_at) {
          return article;
        }
        return prevArticle;
      });
      setArticleEvent(prev => {
        if (!prev || prev?.created_at < event.created_at) {
          return event;
        }
        return prev;
      });
      return;
    }
  }

  useEffect(() => {
    if (newConn.length === 0) return;
    if (!worker) return;

    const callRelay =
      newConn.length > 0
        ? {
            type: CallRelayType.batch,
            data: newConn,
          }
        : {
            type: CallRelayType.connected,
            data: [],
          };

    worker
      .subMetadata([publicKey as string], undefined, callRelay)
      .iterating({ cb: handleEvent });

    const filter = Nip23.filter({
      authors: [publicKey as string],
      articleIds: [articleId as string],
    });
    worker
      .subFilter({ filter, customId: 'article-data', callRelay })
      .iterating({ cb: handleEvent });
  }, [newConn, publicKey]);

  const content = useMemo(() => {
    if (articleEvent == null) return;

    const event = articleEvent;
    event.content = Nip08.replaceMentionPublickey(
      event,
      userMap,
      RenderFlag.Markdown,
    );
    event.content = Nip08.replaceMentionEventId(event, RenderFlag.Markdown);
    return event.content;
  }, [articleEvent, userMap]);

  return (
    <>
      <Head>
        <title>{preArticle?.title || 'nostr blog post'}</title>
        <meta
          name="description"
          content={preArticle?.summary || 'nostr nip23 long-form post'}
        />
        <meta
          property="og:title"
          content={preArticle?.title || 'nostr blog post'}
        />
        <meta
          property="og:description"
          content={preArticle?.summary || 'nostr nip23 long-form post'}
        />
        <meta property="og:image" content={preArticle?.image} />
        <meta property="og:type" content="article" />
        <meta
          name="keywords"
          content={preArticle?.hashTags?.join(',').toString()}
        />
        <meta name="author" content={preArticle?.pubKey || publicKey} />
        <meta
          name="published_date"
          content={toTimeString(preArticle?.published_at)}
        />
        <meta
          name="last_updated_date"
          content={toTimeString(preArticle?.updated_at)}
        />
        <meta name="category" content={'flycat nostr blog post'} />
      </Head>
      <BaseLayout silent={true}>
        <Left>
          <div className={styles.postContainer}>
            <div className={styles.post}>
              <PostContent
                article={article}
                publicKey={publicKey}
                userMap={userMap}
                articleId={articleId}
                content={content}
                t={t}
              />

              <PostReactions
                worker={worker!}
                ownerEvent={articleEvent!}
                userMap={userMap}
                seen={[]}
              />

              <div className={styles.info}>
                <div className={styles.author}>
                  <div className={styles.picture}>
                    <Link href={Paths.user + publicKey}>
                      <img
                        src={userMap.get(publicKey)?.picture}
                        alt={userMap.get(publicKey)?.name}
                      />
                    </Link>
                  </div>

                  <div
                    className={styles.name}
                    onClick={() => window.open(Paths.user + publicKey, 'blank')}
                  >
                    {userMap.get(publicKey)?.name}
                  </div>

                  <div className={styles.btnContainer}>
                    <Button
                      className={styles.btn}
                      onClick={async () => {
                        const lnUrl =
                          userMap.get(publicKey)?.lud06 ||
                          userMap.get(publicKey)?.lud16;
                        if (lnUrl == null) {
                          return alert(
                            'no ln url, please tell the author to set up one.',
                          );
                        }
                        await payLnUrlInWebLn(lnUrl);
                      }}
                    >
                      <Icon
                        style={{ width: '18px', height: '18px' }}
                        type="icon-bolt"
                      />
                      <span>{'Zap the author'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            {articleEvent && (
              <Comments
                rootEvent={articleEvent}
                className={styles.commentContainer}
              />
            )}
          </div>
        </Left>
        <Right></Right>
      </BaseLayout>
    </>
  );
}

export const getStaticProps = async ({
  params,
  locale,
}: {
  params: { publicKey: string; articleId: string };
  locale: string;
}) => {
  const { publicKey, articleId } = params;

  const filter = Nip23.filter({
    authors: [publicKey as string],
    articleIds: [articleId as string],
    overrides: { limit: 1 },
  });
  const events = await callSubFilter({ filter, eventLimit: 1 });
  let article: Article | null = null;
  if (events.length > 0) {
    article = Nip23.toArticle(events[0]);
    article = Object.fromEntries(
      Object.entries(article).filter(([key, value]) => value !== undefined), // undefined value key must be omit in order to serialize
    ) as Article;
  }

  return {
    props: {
      preArticle: article,
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};

export const getStaticPaths = () => ({ paths: [], fallback: 'blocking' });
