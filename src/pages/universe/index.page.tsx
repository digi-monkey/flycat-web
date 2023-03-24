import { BaseLayout, Left, Right } from 'components/layout/BaseLayout';
import { Msgs } from 'components/layout/msg/Msg';
import { loginMapStateToProps } from 'pages/helper';
import { EventWithSeen } from 'pages/type';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { connect, useSelector } from 'react-redux';
import { defaultRelays } from 'service/relay';
import { UserMap } from 'service/type';
import { CallRelayType } from 'service/worker/type';
import { RootState } from 'store/configureStore';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  WellKnownEventKind,
  Event,
  EventSetMetadataContent,
  deserializeMetadata,
} from 'service/api';
import styled from 'styled-components';
import SimpleSelect from 'components/inputs/Select';
import PublicIcon from '@mui/icons-material/Public';

const styles = {
  label: { color: 'gray', fontSize: '14px' },
  section: { marginBottom: '40px' },
};

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

  let relays = defaultRelays;
  if (isLoggedIn === true) {
    relays = relays
      .concat(...(myCustomRelay[myPublicKey] ?? []))
      .filter((item, index, self) => self.indexOf(item) === index);
  }

  const [selectedRelayUrl, setSelectedRelayUrl] = useState<string | null>();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [events, setEvents] = useState<EventWithSeen[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const { worker, newConn, wsConnectStatus } = useCallWorker();

  useEffect(() => {
    setSelectedRelayUrl(defaultRelays[0]);
  }, []);

  function handleEvent(event: Event, relayUrl?: string) {
    console.debug(`[${worker?._workerId}]receive event`);
    if (event.kind === WellKnownEventKind.set_metadata) {
      const metadata: EventSetMetadataContent = deserializeMetadata(
        event.content,
      );
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

    if (event.kind === WellKnownEventKind.text_note) {
      // Add the event to the events array
      setEvents(oldArray => {
        if (oldArray.map(e => e.id).includes(event.id)) {
          const id = oldArray.findIndex(s => s.id === event.id);
          if (id === -1) return oldArray;

          if (!oldArray[id].seen?.includes(relayUrl!)) {
            oldArray[id].seen?.push(relayUrl!);
          }
          return oldArray;
        }

        const newItems = [...oldArray, { ...event, ...{ seen: [relayUrl!] } }];
        // sort by timestamp
        const sortedItems = newItems.sort((a, b) =>
          a.created_at >= b.created_at ? -1 : 1,
        );
        return sortedItems;
      });

      if (userMap.get(event.pubkey) == null) {
        const sub = worker?.subMetadata([event.pubkey]);
        sub?.iterating({ cb: handleEvent });
      }

      return;
    }
  }

  useEffect(() => {
    if (!selectedRelayUrl) return;

    if (wsConnectStatus.get(selectedRelayUrl) == null) return;

    const isConnected: boolean = wsConnectStatus.get(selectedRelayUrl)!;
    setIsConnected(isConnected);
  }, [newConn, selectedRelayUrl]);

  const fetchEvents = async () => {
    const filter = { kinds: [WellKnownEventKind.text_note], limit: 100 };
    const sub = worker?.subFilter(filter, undefined, undefined, {
      type: CallRelayType.single,
      data: [selectedRelayUrl!],
    });
    console.log(sub?.subscriptionId);
    sub?.iterating({ cb: handleEvent });
  };

  useEffect(() => {
    if (worker == null) return;
    if (selectedRelayUrl == null || selectedRelayUrl.length === 0) return;
    if (isConnected === false) return;

    setEvents(prev => []);
    fetchEvents();
  }, [selectedRelayUrl, isConnected]);

  return (
    <BaseLayout>
      <Left>
        <div>
          <div style={styles.section}>
            <h3 style={{ textTransform: 'capitalize' }}>
              {t('relayUniverse.title')}
            </h3>
            {Msgs(events, worker!, userMap, relays)}
          </div>
        </div>
      </Left>
      <Right>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              color: 'black',
              fontSize: '16px',
              margin: '10px 0px',
              display: 'block',
            }}
          >
            <div style={{ marginTop: '10px' }}>
              <div
                style={{ color: 'gray', fontSize: '14px', marginRight: '20px' }}
              >
                {t('relayUniverse.selectLabel')}
              </div>
              <PublicIcon
                fontSize="large"
                style={{
                  color: isConnected ? 'green' : 'red',
                  marginRight: '5px',
                }}
              />
              <SimpleSelect
                defaultOption={defaultRelays[0]}
                options={relays}
                callBack={setSelectedRelayUrl}
              />
            </div>
          </div>
          <ThinHr />
        </div>
      </Right>
    </BaseLayout>
  );
}

export default connect(loginMapStateToProps)(Backup);

function ThinHr() {
  return <div style={{ borderBottom: '1px solid #f1eded' }} />;
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
})