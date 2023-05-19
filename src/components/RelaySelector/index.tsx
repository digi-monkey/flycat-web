import { Grid } from '@mui/material';
import { useCallWorker } from 'hooks/useWorker';
import { useTranslation } from 'next-i18next';
import { SwitchRelays, WsConnectStatus } from 'service/worker/type';
import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useDefaultGroup } from './hooks/useDefaultGroup';
import { getSelectGroupId } from './util';
import { relayGroups } from './groups';
import { RelaySelectorStore } from './store';
import { Button, Select } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

import styles from './index.module.scss';
import styled from 'styled-components';

export interface RelaySelectorProps {
  wsStatusCallback?: (WsConnectStatus: WsConnectStatus) => any;
  newConnCallback?: (conns: string[]) => any;
}

const Link = styled.a`
  textdecoration: none;
  color: gray;
  :hover {
    textdecoration: underline;
  }
`;

export function RelaySelector({
  wsStatusCallback,
  newConnCallback,
}: RelaySelectorProps) {
  const { t } = useTranslation();
  const defaultGroup = useDefaultGroup();
  const groups = { ...relayGroups, default: defaultGroup };

  const store = new RelaySelectorStore();
  const myPublicKey = useReadonlyMyPublicKey();

  const [selectedGroup, setSelectedGroup] = useState<string>();
  const [switchRelays, setSwitchRelays] = useState<SwitchRelays>();
  const [showRelayStatus, setShowRelayStatus] = useState<boolean>(false);

  const { worker, newConn, wsConnectStatus } = useCallWorker();

  useEffect(() => {
    if (!myPublicKey) return;

    const selected = store.loadSelectedGroupId(myPublicKey);
    if (selected) {
      setSelectedGroup(selected);
    }
  }, [myPublicKey]);

  useEffect(() => {
    if (selectedGroup) {
      setSwitchRelays(prev => {
        return {
          id: selectedGroup,
          relays: groups[selectedGroup],
        };
      });

      const savedSelectedGroupId = store.loadSelectedGroupId(myPublicKey);
      if (savedSelectedGroupId !== selectedGroup) {
        store.saveSelectedGroupId(myPublicKey, selectedGroup);
      }
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (newConnCallback) {
      newConnCallback(newConn);
    }
  }, [newConn]);

  useEffect(() => {
    if (wsStatusCallback) {
      wsStatusCallback(wsConnectStatus);
    }
  }, [wsConnectStatus]);

  useEffect(() => {
    if (switchRelays?.relays) {
      const keys = Array.from(wsConnectStatus.keys());
      for (const key of keys) {
        if (!switchRelays.relays.map(r => r.url).includes(key)) {
          wsConnectStatus.delete(key);
        }
      }
    }
  }, [switchRelays?.relays, wsConnectStatus]);

  useEffect(() => {
    if (switchRelays == null) return;
    if (switchRelays.relays == null || switchRelays?.relays.length === 0)
      return;
    if (worker == null) return;

    if (worker.relayGroupId !== switchRelays?.id) {
      worker?.switchRelays(switchRelays);
      worker?.pullRelayGroupId();
    }
  }, [switchRelays, worker?.relayGroupId]);

  // show relay status
  const relayerStatusUI: any[] = [];
  const relayerStatusIds: string[] = [];
  const connectStatusArray = Array.from(wsConnectStatus.entries());
  for (const relay of switchRelays?.relays || []) {
    let status = connectStatusArray
      .filter(c => c[0] === relay.url)
      .map(c => c[1])[0];
    if (status == null) {
      // not found, it is not connected
      status = false;
    }
    const style = status ? styles.connected : styles.disconnected;
    const item = (
      <li className={styles.rightMenuLi} key={relay.url}>
        <Grid container style={{ fontSize: '14px' }}>
          <Grid item xs={12} sm={8}>
            <span className={style}> · </span>
            <span style={{ color: 'gray' }}>
              <Link href={'/backup?relay=' + relay}>{relay.url}</Link>
            </span>
          </Grid>
        </Grid>
      </li>
    );
    const index = relayerStatusIds.findIndex(v => v === relay.url);
    if (index != -1) {
      relayerStatusUI[index] = item;
    } else {
      relayerStatusIds[relayerStatusIds.length] = relay.url;
      relayerStatusUI[relayerStatusUI.length] = item;
    }
  }

  const getOptions = () => {
    const ids = getSelectGroupId(groups);
    return ids.map(id => {
      return { value: id, label: `${id}(${groups[id].length})` };
    });
  };

  return (
    <div className={styles.relaySelector}>
      <Select
        defaultValue={'default'}
        value={selectedGroup}
        style={{ width: '70%' }}
        onChange={setSelectedGroup}
        options={getOptions()}
      />

      <Button
        style={{ margin: '10px 5px' }}
        onClick={() => {
          setShowRelayStatus(!showRelayStatus);
        }}
        icon={<MenuOutlined />}
      />

      <div className={styles.relayStatus} hidden={!showRelayStatus}>
        {relayerStatusUI}
      </div>
    </div>
  );
}
