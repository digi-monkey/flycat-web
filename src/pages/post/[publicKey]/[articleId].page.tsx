import { useRouter } from 'next/router';
import { useCallWorker } from 'hooks/useWorker';
import { useTranslation } from 'next-i18next';
import { Article, Nip23 } from 'core/nip/23';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { useEffect, useState } from 'react';
import { EventSetMetadataContent } from 'core/nostr/type';
import { toTimeString } from './util';

import styles from './index.module.scss';
import Head from 'next/head';
import PostContent from './PostContent';
import PostReactions from 'components/PostItems/PostReactions';
import Link from 'next/link';
import { Paths } from 'constants/path';
import { payLnUrlInWebLn } from 'core/lighting/lighting';
import Icon from 'components/Icon';
import Comments from 'components/Comments';
import PageTitle from 'components/PageTitle';
import { usePubkeyFromRouterQuery } from 'hooks/usePubkeyFromRouterQuery';
import { parsePublicKeyFromUserIdentifier } from 'utils/common';
import { getArticle } from 'core/api/article';
import { isValidPublicKey } from 'utils/validator';
import { dbQuery, profileQuery } from 'core/db';
import { deserializeMetadata } from 'core/nostr/content';
import { Event } from 'core/nostr/Event';
import { Button } from 'components/shared/ui/Button';

type UserParams = {
  publicKey: string;
  articleId: string;
};

export default function NewArticle({ preArticle }: { preArticle?: Article }) {
  const router = useRouter();
  const { t } = useTranslation();
  const query = useRouter().query as UserParams;
  const { publicKey: userIdentifier } = query;
  const publicKey = usePubkeyFromRouterQuery(userIdentifier);
  const articleId = decodeURIComponent(query.articleId);
  const { worker, newConn } = useCallWorker();

  const [article, setArticle] = useState<Article | undefined>(preArticle);
  const [userProfile, setUserProfile] = useState<EventSetMetadataContent>();

  useEffect(() => {
    if (!isValidPublicKey(publicKey)) return;

    profileQuery.getProfileByPubkey(publicKey).then(e => {
      if (e != null) {
        setUserProfile(deserializeMetadata(e.content));
      } else {
        worker?.subMetadata([publicKey as string], undefined);
      }
    });
  }, [publicKey]);

  useEffect(() => {
    if (!preArticle) {
      const filter = Nip23.filter({
        authors: [publicKey as string],
        articleIds: [articleId as string],
      });
      const setArticleCb = (event: Event) => {
        const article = Nip23.toArticle(event);
        setArticle(prevArticle => {
          if (!prevArticle || article?.updated_at >= prevArticle.updated_at) {
            return article;
          }
          return prevArticle;
        });
      };
      dbQuery
        .matchFilterRelay(filter, worker?.relays.map(r => r.url) || [])
        .then(evets => {
          if (evets.length === 0) {
            worker
              ?.subFilter({ filter, customId: 'article-data' })
              .iterating({ cb: setArticleCb });
          }

          for (const event of evets) {
            setArticleCb(event);
          }
        });
    }
  }, [preArticle, publicKey]);

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
          <PageTitle
            title="Article"
            icon={
              <Icon
                onClick={() => router.back()}
                width={24}
                height={24}
                type="icon-arrow-left"
              />
            }
          />
          <div className={styles.postContainer}>
            <div className={styles.post}>
              {article && (
                <PostContent
                  article={preArticle ?? article}
                  publicKey={publicKey}
                  userProfile={userProfile}
                  articleId={articleId}
                  t={t}
                />
              )}

              {article && (
                <PostReactions
                  worker={worker!}
                  ownerEvent={Nip23.articleToEvent(article)}
                  seen={[]}
                />
              )}

              <div className={styles.info}>
                <div className={styles.author}>
                  <div className={styles.picture}>
                    <Link href={Paths.user + publicKey}>
                      <img src={userProfile?.picture} alt={userProfile?.name} />
                    </Link>
                  </div>

                  <div
                    className={styles.name}
                    onClick={() => router.push(Paths.user + publicKey, 'blank')}
                  >
                    {userProfile?.name}
                  </div>

                  <div className={styles.btnContainer}>
                    <Button
                      className={styles.btn}
                      onClick={async () => {
                        const lnUrl = userProfile?.lud06 || userProfile?.lud16;
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
            {article && (
              <Comments
                rootEvent={Nip23.articleToEvent(article)}
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
  const { publicKey: userId, articleId } = params;
  const publicKey = await parsePublicKeyFromUserIdentifier(userId);
  if (!publicKey) {
    return {
      props: {
        preArticle: null,
        ...(await serverSideTranslations(locale, ['common'])),
      },
    };
  }

  let article: Article | null = null;
  const e = await getArticle(publicKey, articleId);
  if (e != null) {
    article = Nip23.toArticle(e);
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
