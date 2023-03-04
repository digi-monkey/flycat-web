import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import RelayManager from 'app/components/layout/relay/RelayManager';
import { loginMapStateToProps } from 'app/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { isEventSubResponse, WellKnownEventKind, Event } from 'service/api';
import { isValidWssUrl } from 'service/helper';
import { defaultRelays } from 'service/relay';
import { CallRelayType } from 'service/worker/type';
import { RootState } from 'store/configureStore';
import styled from 'styled-components';
import EventData from './EventData';
import SimpleSelect from '../../components/inputs/Select';
import { BPEvent } from './type';

const styles = {
  label: { color: 'gray', fontSize: '14px' },
  section: { marginBottom: '40px' },
};

const allEventKinds = Object.values(WellKnownEventKind).filter(k =>
  Number.isInteger(k),
);

const LightBtn = styled.button`
  border: none;
  color: white;
  background: rgb(141, 197, 63);
  margin-left: 10px;
  :hover {
    color: black;
    background: white;
    border: 1px solid rgb(141, 197, 63);
  }
`;

export function Backup({ isLoggedIn }) {
  const { t } = useTranslation();
  const myCustomRelay = useSelector((state: RootState) => state.relayReducer);
  const myPublicKey = useReadonlyMyPublicKey();
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

  const [relayUrl, setRelayUrl] = useState<string | null>();
  useEffect(() => {
    const relayUrl = localRelay || params.get('relay');
    setRelayUrl(relayUrl);
  }, [relays]);

  const updateWorkerMsgListenerDeps = [relayUrl];
  const { worker, newConn, wsConnectStatus } = useCallWorker({
    onMsgHandler,
    updateWorkerMsgListenerDeps,
  });

  const relayStatusCacheValue = useMemo(() => {
    if (relayUrl) {
      return wsConnectStatus.get(relayUrl);
    }
  }, [wsConnectStatus]);

  const [events, setEvents] = useState<BPEvent[]>([]);
  const [syncEvents, setSyncEvents] = useState<Event[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isValidRelay, setIsValidRelay] = useState(false);
  const [hasFetchedAllEvents, setHasFetchedAllEvents] = useState(false);
  const [filterKind, setFilterKind] = useState<string>();

  // Total events we want to render in the activity list
  const eventsToRenderLimit = 300;

  const isPrivateBackup =
    relayUrl?.startsWith('ws://localhost') ||
    relayUrl?.startsWith('wss://localhost');

  function onMsgHandler(this, data: any, msgRelayUrl?: string) {
    const msg = JSON.parse(data);
    if (isEventSubResponse(msg)) {
      const event = msg[2];
      if (msgRelayUrl == null || relayUrl == null) return;

      if (msgRelayUrl === relayUrl) {
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

      if (msgRelayUrl !== relayUrl) {
        // Add the event to the sync events array
        setSyncEvents(prevEvents => {
          if (prevEvents.map(e => e.id).includes(event.id)) {
            // duplicated
            return prevEvents;
          }
          return [event, ...prevEvents];
        });
      }
    }
  }

  useEffect(() => {
    if (!isValidRelay) return;
    if (!isLoggedIn) return;
    if (relayUrl == null) return;
    if (relayStatusCacheValue !== true) return;
    if (!isConnected) return;
    if (!worker) return;

    fetchBackUp();
  }, [
    isConnected,
    relayUrl,
    isValidRelay,
    isLoggedIn,
    worker,
    relayStatusCacheValue,
  ]);

  useEffect(() => {
    if (!relayUrl) return;

    if (wsConnectStatus.get(relayUrl) == null) return;

    const isConnected: boolean = wsConnectStatus.get(relayUrl)!;
    setIsConnected(isConnected);
  }, [wsConnectStatus, relayUrl]);

  useEffect(() => {
    const isValid = relayUrl != null && isValidWssUrl(relayUrl);
    setIsValidRelay(isValid);
  }, [relayUrl]);

  const fetchBackUp = async () => {
    const filter = { authors: [myPublicKey], limit: 1000 };
    worker?.subFilter(filter, undefined, undefined, {
      type: CallRelayType.single,
      data: [relayUrl!],
    });
  };

  const sync = async () => {
    const filter = { authors: [myPublicKey], limit: 1000 };
    worker?.subFilter(filter, undefined, undefined, {
      type: CallRelayType.batch,
      data: Array.from(wsConnectStatus.keys()).filter(s => s !== relayUrl),
    });
  };

  const backupSync = async () => {
    if (
      !relayUrl?.startsWith('ws://localhost') &&
      !relayUrl?.startsWith('wss://localhost')
    ) {
      alert(
        `unable to backup to public relay! \nThis might highly got banned from the service! \nNow we only support for private relay(ws://localhost)`,
      );
      return;
    }

    const backupIds = Array.from(events).map(s => s.id);
    const diffEvents = syncEvents.filter(
      targetEvent => !backupIds.includes(targetEvent.id),
    );
    for (const event of diffEvents) {
      // only send the diff
      worker?.pubEvent(event, {
        type: CallRelayType.single,
        data: [relayUrl!],
      });
    }

    fetchBackUp();

    alert(
      diffEvents.length +
        " events sent! please check your private relay's log if the you think the backup is still behind other relays",
    );
  };

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
              {isPrivateBackup && (
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ color: 'gray', fontSize: '12px' }}>
                    <span style={{ color: 'black' }}>{syncEvents.length}</span>
                    {t('backup.itemsOnOtherRelay')}
                  </span>
                  <LightBtn onClick={sync}>{t('backup.fetch')}</LightBtn>
                  <LightBtn onClick={backupSync}>
                    {t('backup.syncToBackUp')}
                  </LightBtn>
                </div>
              )}
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
        <RelayManager />
      </Right>
    </BaseLayout>
  );
}

export default connect(loginMapStateToProps)(Backup);

function ThinHr() {
  return <div style={{ borderBottom: '1px solid #f1eded' }} />;
}
