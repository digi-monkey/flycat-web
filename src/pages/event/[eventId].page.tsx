import { useRouter } from 'next/router';
import { useCallWorker } from 'hooks/useWorker';
import { EventWithSeen } from 'pages/type';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { useState, useEffect } from 'react';
import { dexieDb } from 'core/db';
import { NotePreview, getNotePreview } from 'core/api/preview';

import Head from 'next/head';
import PostItems from 'components/PostItems';
import Comments from 'components/Comments';
import PageTitle from 'components/PageTitle';
import Icon from 'components/Icon';

export default function EventPage({
  notePreview,
}: {
  notePreview: NotePreview | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { worker } = useCallWorker();
  const { eventId } = router.query as { eventId: string };
  const [rootEvent, setRootEvent] = useState<EventWithSeen>();

  const subRootEvent = async () => {
    if (!worker) return;

    const handle = worker.subMsgByEventIds([eventId]).getIterator();
    for await (const data of handle) {
      if (data.event.id === eventId) {
        setRootEvent(data.event);
        break;
      }
    }
  };

  useEffect(() => {
    if (!eventId) return;

    dexieDb.event.get(eventId).then(event => {
      if (!event) {
        subRootEvent();
        return;
      }
      setRootEvent(event);
    });
  }, [eventId]);

  return (
    <>
      <Head>
        <title>{notePreview?.title || 'nostr short note'}</title>
        <meta
          name="description"
          content={notePreview?.content || 'nostr short note'}
        />
        <meta
          property="og:title"
          content={notePreview?.title || 'nostr short note'}
        />
        <meta
          property="og:description"
          content={notePreview?.content || 'nostr short note'}
        />
        <meta property="og:image" content={notePreview?.image} />
        <meta property="og:type" content="article" />
        <meta name="author" content={notePreview?.authorProfile?.name} />

        <meta
          name="twitter:image:src"
          content={notePreview?.image || 'https://flycat.club/logo512.png'}
        />
        <meta name="twitter:site" content="@flycatclub" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={notePreview?.title} />
        <meta name="twitter:description" content={notePreview?.content} />
      </Head>
      <BaseLayout>
        <Left>
          <div>
            <PageTitle
              title={t('thread.title')}
              icon={
                <Icon
                  onClick={() => router.back()}
                  width={24}
                  height={24}
                  type="icon-arrow-left"
                />
              }
            />

            {rootEvent && (
              <>
                <PostItems
                  msgList={[rootEvent]}
                  worker={worker!}
                  showLastReplyToEvent={true}
                  isExpanded={true}
                />

                <Comments rootEvent={rootEvent} />
              </>
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
  params: { eventId: string };
  locale: string;
}) => {
  const { eventId } = params;
  const preview = await getNotePreview(eventId);
  return {
    props: {
      notePreview: preview,
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};

export const getStaticPaths = () => ({ paths: [], fallback: true });
