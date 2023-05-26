import { useCallWorker } from 'hooks/useWorker';
import { useTranslation } from 'next-i18next';
import { SwitchRelays, WsConnectStatus } from 'service/worker/type';
import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useDefaultGroup } from '../../pages/relay/hooks/useDefaultGroup';
import { initModeOptions } from './util';
import { Cascader, Spin } from 'antd';
import { dropdownRender } from './dropdown';
import { RelayGroup } from 'service/relay/group';
import { RelayGroupMap } from 'service/relay/group/type';
import { useLoadSelectedStore } from './hooks/useLoadSelectedStore';
import { useGetSwitchRelay } from './hooks/useGetSwitchRelay';

import styles from './index.module.scss';

export interface RelaySelectorProps {
  wsStatusCallback?: (WsConnectStatus: WsConnectStatus) => any;
  newConnCallback?: (conns: string[]) => any;
}

export interface Option {
  value: string;
  label: string;
  children?: Option[];
}

export function RelaySelector({
  wsStatusCallback,
  newConnCallback,
}: RelaySelectorProps) {
  const { t } = useTranslation();
  const defaultGroup = useDefaultGroup();
  const myPublicKey = useReadonlyMyPublicKey();

  const [relayGroupMap, setRelayGroupMap] = useState<RelayGroupMap>(new Map());

  const { worker, newConn, wsConnectStatus } = useCallWorker();

  const [selectedValue, setSelectedValue] = useState<string[]>();
  const [switchRelays, setSwitchRelays] = useState<SwitchRelays>();

  const [progressLoading, setProgressLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const progressBegin = () => {
    setProgressLoading(true);
    setShowProgress(true);
  };

  const progressEnd = () => {
    setProgressLoading(false);
    setShowProgress(false);
  };

  useLoadSelectedStore(myPublicKey, setSelectedValue);
  useGetSwitchRelay(
    myPublicKey,
    relayGroupMap,
    selectedValue,
    setSwitchRelays,
    progressBegin,
    progressEnd,
  );

  useEffect(() => {
    // new a default group for the forward-compatibility
    const defaultGroupId = "default";
    const groups = new RelayGroup(myPublicKey);
    if (groups.getGroupById(defaultGroupId) == null && defaultGroup) {
      groups.setGroup(defaultGroupId, defaultGroup);
    }
    setRelayGroupMap(groups.map);
  }, [defaultGroup]);

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

  return (
    <div className={styles.relaySelector}>
      <Cascader
        defaultValue={['global', 'default']}
        style={{ width: '100%', borderRadius: '8px' }}
        dropdownRender={dropdownRender}
        options={initModeOptions(relayGroupMap)}
        allowClear={false}
        value={selectedValue}
        onChange={(value: string[] | any) => {
          setSelectedValue(value);
        }}
      />
      {showProgress && (
        <div className={styles.overlay}>
          <div className={styles.spinContainer}>
            <Spin
              size="large"
              tip="init mode, might takes 2-3 minutes, please wait.."
              spinning={progressLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
