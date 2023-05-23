import { useCallWorker } from 'hooks/useWorker';
import { useTranslation } from 'next-i18next';
import { SwitchRelays, WsConnectStatus } from 'service/worker/type';
import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useDefaultGroup } from './hooks/useDefaultGroup';
import { getSelectGroupId } from './util';
import { relayGroups } from './groups';
import { RelaySelectorStore } from './store';
import { Cascader, Spin } from 'antd';

import styles from './index.module.scss';
import styled from 'styled-components';
import { dropdownRender } from './dropdown';
import { RelayMode, RelayModeSelectOption, toLabel, toRelayMode } from './type';
import { Pool } from 'service/relay/pool';
import { db } from 'service/relay/auto';

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
  const groups = { ...relayGroups, default: defaultGroup };

  const store = new RelaySelectorStore();
  const myPublicKey = useReadonlyMyPublicKey();

  const [selectedValue, setSelectedValue] = useState<string[]>();
  const [selectedGroup, setSelectedGroup] = useState<string>();
  const [switchRelays, setSwitchRelays] = useState<SwitchRelays>();

  const [progressLoading, setProgressLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const { worker, newConn, wsConnectStatus } = useCallWorker();


  const getRelayGroupOptions = () => {
    const ids = getSelectGroupId(groups);
    return ids.map(id => {
      return { value: id, label: `${id}(${groups[id].length})` };
    });
  };
  
  const getModeOptions = () => {
    const mode: RelayModeSelectOption[] = [
      {
        value: RelayMode.global,
        label: toLabel(RelayMode.global),
        children: getRelayGroupOptions(),
      },
      { value: RelayMode.auto, label: toLabel(RelayMode.auto) },
      { value: RelayMode.fastest, label: toLabel(RelayMode.fastest) },
      { value: RelayMode.rule, label: toLabel(RelayMode.rule), disabled: true },
    ];
    return mode;
  };

  const getSwitchRelayByMode = async (mode: RelayMode) => {
    if (mode === RelayMode.auto) {
      const savedResult = store.loadAutoRelayResult(myPublicKey);
      if (savedResult) {
        return {
          id: mode,
          relays: savedResult,
        };
      }

      const relayPool = new Pool();
      const allRelays = await relayPool.getAllRelays();
      await Pool.getBestRelay(
        allRelays.map(r => r.url),
        myPublicKey,
      );
      const relays = (await db.pick(myPublicKey)).slice(0, 6).map(i => i.relay);
      store.saveAutoRelayResult(
        myPublicKey,
        relays.map(r => {
          return { url: r, read: false, write: true };
        }),
      );

      return {
        id: mode,
        relays: relays.map(r => {
          return {
            url: r,
            read: false,
            write: true,
          };
        }),
      };
    }

    if (mode === RelayMode.fastest) {
      const relayPool = new Pool();
      const allRelays = await relayPool.getAllRelays();
      const fastest = await Pool.getFastest(allRelays.map(r => r.url));

      return {
        id: mode,
        relays: [
          {
            url: fastest[0],
            read: true,
            write: true,
          },
        ],
      };
    }

    if (mode === RelayMode.rule) {
      return {
        id: mode,
        relays: [], // todo
      };
    }

    if (mode === RelayMode.global) {
      if (!selectedGroup) throw new Error('no selected group');

      return {
        id: selectedGroup,
        relays: groups[selectedGroup],
      };
    }

    throw new Error('unknown mode');
  };

  const onSwitchRelay = async () => {
    if (selectedValue) {
      const mode = toRelayMode(selectedValue[0]);

      const savedSelectedMode = store.loadSelectedMode(myPublicKey);
      if (savedSelectedMode !== mode) {
        store.saveSelectedMode(myPublicKey, mode);
      }

      if (mode === RelayMode.global) {
        const groupId = selectedValue[1];
        setSelectedGroup(groupId);
      } else {
        setProgressLoading(true);
        setShowProgress(true);
        const switchRelays = await getSwitchRelayByMode(mode);
        setProgressLoading(false);
        setShowProgress(false);
        setSwitchRelays(prev => {
          return switchRelays;
        });
      }
    }
  };

  useEffect(() => {
    if (!myPublicKey) return;

    const selectedGroup = store.loadSelectedGroupId(myPublicKey);
    if (selectedGroup) {
      setSelectedGroup(selectedGroup);
    }

    const selectedMode = store.loadSelectedMode(myPublicKey);
    if (selectedMode === RelayMode.global) {
      if (selectedGroup) {
        setSelectedValue([selectedMode, selectedGroup]);
      }
    } else if (selectedMode) {
      setSelectedValue([selectedMode]);
    }
  }, [myPublicKey]);

  useEffect(() => {
    onSwitchRelay();
  }, [selectedValue]);

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

  const onChange = (value: string[] | any) => {
    setSelectedValue(value);
  };

  return (
    <div className={styles.relaySelector}>
      <Cascader
        defaultValue={['global', 'default']}
        style={{ width: '100%', borderRadius: '8px' }}
        dropdownRender={dropdownRender}
        options={getModeOptions()}
        allowClear={false}
        value={selectedValue}
        onChange={onChange}
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
