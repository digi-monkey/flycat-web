import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import { Msgs } from 'app/components/layout/msg/Msg';
import { loginMapStateToProps } from 'app/helper';
import { EventWithSeen } from 'app/type';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useSelector } from 'react-redux';
import {
  isEventSubResponse,
  WellKnownEventKind,
  EventSetMetadataContent,
  deserializeMetadata,
} from 'service/api';
import { defaultRelays } from 'service/relay';
import { UserMap } from 'service/type';
import { CallRelayType } from 'service/worker/type';
import { RootState } from 'store/configureStore';
import styled from 'styled-components';
import SimpleSelect from '../../components/inputs/Select';
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

export function Universe({ isLoggedIn }) {
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

  const { worker, newConn, wsConnectStatus } = useCallWorker({
    onMsgHandler,
    updateWorkerMsgListenerDeps: [selectedRelayUrl, userMap.size],
  });

  useEffect(() => {
    setSelectedRelayUrl(defaultRelays[0]);
  }, []);

  // Total events we want to render in the activity list
  const eventsToRenderLimit = 300;

  function onMsgHandler(this, data: any, relayUrl?: string) {
    const msg = JSON.parse(data);
    if (isEventSubResponse(msg)) {
      const event = msg[2];
      if (relayUrl !== selectedRelayUrl) return;

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

          const newItems = [
            ...oldArray,
            { ...event, ...{ seen: [relayUrl!] } },
          ];
          // sort by timestamp
          const sortedItems = newItems.sort((a, b) =>
            a.created_at >= b.created_at ? -1 : 1,
          );
          return sortedItems;
        });

        if (userMap.get(event.pubkey) == null) {
          worker?.subMetadata([event.pubkey]);
        }

        return;
      }
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
    worker?.subFilter(filter, undefined, undefined, {
      type: CallRelayType.single,
      data: [selectedRelayUrl!],
    });
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

export default connect(loginMapStateToProps)(Universe);

function ThinHr() {
  return <div style={{ borderBottom: '1px solid #f1eded' }} />;
}
