import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import RelayManager, {
  WsConnectStatus,
} from 'app/components/layout/relay/RelayManager';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  EventSubResponse,
  isEventSubResponse,
  WellKnownEventKind,
} from 'service/api';
import { compareMaps, isValidWssUrl } from 'service/helper';
import { defaultRelays } from 'service/relay';
import { CallWorker } from 'service/worker/callWorker';
import { CallRelayType, FromWorkerMessageData } from 'service/worker/type';
import EventData from './EventData';
import SimpleSelect from './Select';
import { BPEvent } from './type';

const styles = {
  label: { color: 'gray', fontSize: '14px' },
  section: { marginBottom: '40px' },
};

const mapStateToProps = state => {
  return {
    isLoggedIn: state.loginReducer.isLoggedIn,
    myPublicKey: state.loginReducer.publicKey,
    myCustomRelay: state.relayReducer,
  };
};

const allEventKinds = Object.values(WellKnownEventKind).filter(k =>
  Number.isInteger(k),
);

export function Backup({ isLoggedIn, myPublicKey, myCustomRelay }) {
  const { t } = useTranslation();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  let relays = defaultRelays;
  if (isLoggedIn === true) {
    relays = relays
      .concat(...(myCustomRelay[myPublicKey] ?? []))
      .filter((item, index, self) => self.indexOf(item) === index);
  }

  // todo: maybe let user specific a local backup relay
  const isLocalRelayTips =
    params.get('local') === 'true' &&
    relays.filter(
      r => r.startsWith('ws://localhost:') || r.startsWith('wss://localhost:'),
    ).length === 0;
  const localRelay =
    params.get('local') === 'true'
      ? relays.filter(
          r =>
            r.startsWith('ws://localhost:') || r.startsWith('wss://localhost:'),
        )[0]
      : undefined;
  const relayUrl = localRelay || params.get('relay');

  const [wsConnectStatus, setWsConnectStatus] = useState<WsConnectStatus>(
    new Map(),
  );
  const relayStatusCacheValue = useMemo(() => {
    if (relayUrl) {
      return wsConnectStatus.get(relayUrl);
    }
  }, [wsConnectStatus]);

  const [worker, setWorker] = useState<CallWorker>();
  const [events, setEvents] = useState<BPEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isValidRelay, setIsValidRelay] = useState(false);
  const [hasFetchedAllEvents, setHasFetchedAllEvents] = useState(false);
  const [filterKind, setFilterKind] = useState<string>();

  // Total events we want to render in the activity list
  const eventsToRenderLimit = 300;

  useEffect(() => {
    const worker = new CallWorker(
      (message: FromWorkerMessageData) => {
        if (message.wsConnectStatus) {
          if (compareMaps(wsConnectStatus, message.wsConnectStatus)) {
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
        onMsgHandler.bind(Backup)(message.nostrData);
      },
    );
    worker.pullWsConnectStatus();
    setWorker(worker);
  }, []);

  function onMsgHandler(data: any) {
    const msg = JSON.parse(data);
    if (isEventSubResponse(msg)) {
      const event = (msg as EventSubResponse)[2];
      // Add the event to the events array
      setEvents(prevEvents => {
        // Extract the relevant data from the event
        const { id, kind, created_at, content } = event;
        if (prevEvents.map(e => e.id).includes(id)) {
          // duplicated
          return prevEvents;
        }

        return [{ id, kind, created_at, content }, ...prevEvents];
      });
    }
  }

  useEffect(() => {
    if (!isValidRelay) return;
    if (!isLoggedIn) return;
    if (!relayUrl) return;
    if (relayStatusCacheValue !== true) return;

    const filter = { authors: [myPublicKey], limit: 1000 };
    worker?.subFilter(filter, undefined, undefined, {
      type: CallRelayType.single,
      data: [relayUrl!],
    });
  }, [isValidRelay, isLoggedIn, worker, relayStatusCacheValue]);

  useEffect(() => {
    if (!relayUrl) return;

    if (wsConnectStatus.get(relayUrl) == null) return;

    const isConnected: boolean = wsConnectStatus.get(relayUrl)!;
    setIsConnected(isConnected);
  }, [wsConnectStatus, relayUrl]);

  useEffect(() => {
    const isValid = relayUrl != null && isValidWssUrl(relayUrl);
    setIsValidRelay(isValid);
  }, []);

  return (
    <BaseLayout>
      <Left>
        {!isLoggedIn && <div>{t('backup.signInFirst')}</div>}
        {isLocalRelayTips && (
          <div style={{ marginBottom: '20px' }}>
            {t('backup.tips')}
            <a
              href="/article/45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a/47858"
              target={'_blank'}
            >
              {t('backup.thisPost')}
            </a>
          </div>
        )}
        {isLoggedIn && !isValidRelay && <div>{t('backup.invalidWs')}</div>}
        {isLoggedIn && isValidRelay && (
          <div>
            <div style={styles.section}>
              <span style={styles.label}>{t('backup.relayStatus')}</span>
              <span
                style={{
                  color: 'black',
                  fontSize: '16px',
                  margin: '10px 0px',
                  display: 'block',
                }}
              >
                {relayUrl}:{' '}
                {isConnected ? (
                  <span style={{ color: 'green' }}>{t('backup.running')}</span>
                ) : (
                  <span style={{ color: 'red' }}>{t('backup.connecting')}</span>
                )}
              </span>
              <ThinHr />
            </div>

            <div style={styles.section}>
              <span style={styles.label}>{t('backup.totalCount')}</span>
              <span
                style={{
                  display: 'block',
                  fontSize: '60px',
                  fontWeight: '700',
                }}
              >
                {events.length}
                <span style={{ fontSize: '14px', color: 'gray' }}>
                  {t('backup.items')}
                </span>
              </span>
              <ThinHr />
            </div>

            <div style={styles.section}>
              <span style={styles.label}>{t('backup.filter')}</span>
              <SimpleSelect options={allEventKinds} callBack={setFilterKind} />
              <EventData
                loading={hasFetchedAllEvents} // todo: fix it to use !hasFetchedAllEvents
                events={events}
                eventsToRenderLimit={eventsToRenderLimit}
                filterKind={filterKind}
              />
            </div>
          </div>
        )}
      </Left>
      <Right>
        <div>
          <RelayManager />
        </div>
      </Right>
    </BaseLayout>
  );
}

export default connect(mapStateToProps)(Backup);

export function ThinHr() {
  return <div style={{ borderBottom: '1px solid #f1eded' }} />;
}
