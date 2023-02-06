import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import RelayManager from 'app/components/layout/relay/RelayManager';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { WellKnownEventKind } from 'service/api';
import { FlycatWellKnownEventKind } from 'service/flycat-protocol';
import { isValidWssUrl } from 'service/helper';
import { defaultRelays } from 'service/relay';
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
    relays.filter(r => r.startsWith('ws://localhost:')).length === 0;
  const localRelay =
    params.get('local') === 'true'
      ? relays.filter(r => r.startsWith('ws://localhost:'))[0]
      : undefined;
  const relayUrl = localRelay || params.get('relay');

  const [events, setEvents] = useState<BPEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isValidRelay, setIsValidRelay] = useState(false);
  const [hasFetchedAllEvents, setHasFetchedAllEvents] = useState(false);
  const [filterKind, setFilterKind] = useState<string>();

  // Total events we want to render in the activity list
  const eventsToRenderLimit = 300;

  useEffect(() => {
    if (!isValidRelay) return;
    if (!isLoggedIn) return;

    //todo: maybe use the shared worker ws too
    // Create websocket connection
    const socket = new WebSocket(relayUrl!);

    // Generate a random subscription ID
    const subscriptionID =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Handle websocket connection open event
    socket.onopen = () => {
      setIsConnected(true);
      // Reset events array to clear previous events
      setEvents([]);
      // Request latest 100 events
      socket.send(
        JSON.stringify([
          'REQ',
          subscriptionID,
          { authors: [myPublicKey], limit: 1000 },
        ]),
      );
    };

    // Handle websocket message event
    socket.onmessage = message => {
      // Parse the message data
      const data = JSON.parse(message.data);

      if (!data.length) {
        console.error('Error: No data length', data);
        return;
      }

      // Check if data is End of Stored Events Notice
      // https://github.com/nostr-protocol/nips/blob/master/15.md
      if (data[0] === 'EOSE') {
        setHasFetchedAllEvents(true);
        return;
      }

      // If the data is of type EVENT
      if (data[0] === 'EVENT') {
        // Add the event to the events array
        setEvents(prevEvents => {
          // Extract the relevant data from the event
          const { id, kind, created_at, content } = data[2];
          if (prevEvents.map(e => e.id).includes(id)) {
            // duplicated
            return prevEvents;
          }

          return [{ id, kind, created_at, content }, ...prevEvents];
        });
      }
    };

    // Handle websocket error
    socket.onerror = () => {
      setIsConnected(false);
    };

    // Handle websocket close
    socket.onclose = () => {
      setIsConnected(false);
    };

    // Cleanup function to run on component unmount
    return () => {
      // Check if the websocket is open
      if (socket.readyState === WebSocket.OPEN) {
        // Stop previous subscription and close the websocket
        socket.send(JSON.stringify(['CLOSE', subscriptionID]));
        socket.close();
      }
    };
  }, [isValidRelay, isLoggedIn]);

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
                loading={!hasFetchedAllEvents}
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
