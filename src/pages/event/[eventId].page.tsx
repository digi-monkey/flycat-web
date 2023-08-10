import { EventMap, UserMap } from 'core/nostr/type';
import { connect } from 'react-redux';
import { useRouter } from 'next/router';
import { useCallWorker } from 'hooks/useWorker';
import { EventWithSeen } from 'pages/type';
import { useTranslation } from 'next-i18next';
import { loginMapStateToProps } from 'pages/helper';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { useState, useEffect } from 'react';
import { getLastEventIdFromETags } from 'core/nostr/util';
import { _handleEvent } from './util';
import { CallRelayType } from 'core/worker/type';

import styles from './index.module.scss';
import PostItems from 'components/PostItems';
import Comments from 'components/Comments';
import PageTitle from 'components/PageTitle';
import Icon from 'components/Icon';

export const EventPage = () => {
  const { t } = useTranslation();
  const { eventId } = useRouter().query as { eventId: string };
  const router = useRouter();
  const { worker, newConn, wsConnectStatus } = useCallWorker();

  const [rootEvent, setRootEvent] = useState<EventWithSeen>();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [eventMap, setEventMap] = useState<EventMap>(new Map());

  const handleEvent = _handleEvent({
    setUserMap,
    eventId,
    setRootEvent,
    setEventMap,
  });

  useEffect(() => {
    if (!worker) return;

    const callRelay =
      newConn.length > 0
        ? { type: CallRelayType.batch, data: newConn }
        : { type: CallRelayType.connected, data: [] };
    worker
      .subMsgByEventIds([eventId], undefined, callRelay)
      .iterating({ cb: handleEvent });
  }, [eventId, worker, newConn]);

  useEffect(() => {
    if (!rootEvent) return;
    if (!worker) return;

    const lastId = getLastEventIdFromETags(rootEvent.tags);
    if (lastId) {
      const callRelay =
        newConn.length > 0
          ? { type: CallRelayType.batch, data: newConn }
          : { type: CallRelayType.connected, data: [] };
      worker
        .subMsgByEventIds([lastId], undefined, callRelay)
        .iterating({ cb: handleEvent });
    }
  }, [rootEvent?.id, newConn, worker]);

  useEffect(() => {
    if (!worker) return;

    const pks = Array.from(eventMap.values()).map(e => e.pubkey);
    if (pks.length > 0) {
      const callRelay =
        newConn.length > 0
          ? { type: CallRelayType.batch, data: newConn }
          : { type: CallRelayType.connected, data: [] };
      worker
        .subMetadata(pks, undefined, callRelay)
        .iterating({ cb: handleEvent });
    }
  }, [eventMap.size, worker]);

  const relayUrls = Array.from(wsConnectStatus.keys());

  return (
    <BaseLayout>
      <Left>
        <div>
          <PageTitle title={t('thread.title')} icon={<Icon onClick={()=>router.back()} width={24} height={24} type='icon-arrow-left'/>}/>

          {rootEvent && (
            <>
              <PostItems
                eventMap={eventMap}
                msgList={[rootEvent]}
                worker={worker!}
                userMap={userMap}
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
