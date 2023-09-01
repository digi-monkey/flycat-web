import { connect } from 'react-redux';
import { useRouter } from 'next/router';
import { useCallWorker } from 'hooks/useWorker';
import { EventWithSeen } from 'pages/type';
import { useTranslation } from 'next-i18next';
import { loginMapStateToProps } from 'pages/helper';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { useState, useEffect } from 'react';
import { createCallRelay } from 'core/worker/util';
import { dexieDb } from 'core/db';

import PostItems from 'components/PostItems';
import Comments from 'components/Comments';
import PageTitle from 'components/PageTitle';
import Icon from 'components/Icon';

export const EventPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { eventId } = router.query as { eventId: string };
  
  const { worker, newConn, wsConnectStatus } = useCallWorker();
  const [rootEvent, setRootEvent] = useState<EventWithSeen>();

  useEffect(() => {
    if (!worker) return;

    const callRelay =
      createCallRelay(newConn);
    worker
      .subMsgByEventIds([eventId], undefined, callRelay)
  }, [eventId, worker, newConn]);

  useEffect(()=>{
    dexieDb.event.get(eventId).then(setRootEvent);
  }, [eventId]);

  
  const relayUrls = Array.from(wsConnectStatus.keys());

  return (
    <BaseLayout>
      <Left>
        <div>
          <PageTitle title={t('thread.title')} icon={<Icon onClick={()=>router.back()} width={24} height={24} type='icon-arrow-left'/>}/>

          {rootEvent && (
            <>
              <PostItems
                msgList={[rootEvent]}
                worker={worker!}
                relays={relayUrls}
                showLastReplyToEvent={true}
              />

              <Comments rootEvent={rootEvent} />
            </>
          )}
        </div>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(EventPage);

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});

export const getStaticPaths = () => ({ paths: [], fallback: true });
