import { Cascader } from 'components/shared/Cascader';
import { ICascaderOption } from 'components/shared/Cascader/types';
import { Paths } from 'constants/path';
import { NIP_65_RELAY_LIST } from 'constants/relay';
import { Nip65 } from 'core/nip/65';
import { RelayGroup } from 'core/relay/group';
import { RelayGroupMap } from 'core/relay/group/type';
import {
  RelaySwitchAlertMsg,
  SwitchRelays,
  WsConnectStatus,
} from 'core/worker/type';
import { createCallRelay } from 'core/worker/util';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { normalizeWsUrl } from 'utils/common';
import { useDefaultGroup } from '../../pages/relay-manager/hooks/useDefaultGroup';
import { useGetSwitchRelay } from './hooks/useGetSwitchRelay';
import { useLoadSelectedStore } from './hooks/useLoadSelectedStore';
import { useSelectedRelay } from './hooks/useSelectedRelay';
import { RelayFooterMenus, RelayMode } from './type';
import { initModeOptions, toConnectStatus } from './util';

export interface RelaySelectorProps {
  wsStatusCallback?: (WsConnectStatus: WsConnectStatus) => any;
  newConnCallback?: (conns: string[]) => any;
  className?: string;
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
  const { worker, newConn, wsConnectStatus } = useCallWorker();
  const router = useRouter();
  const myPublicKey = useReadonlyMyPublicKey();
  const defaultGroup = useDefaultGroup();
  const [relayGroupMap, setRelayGroupMap] = useState<RelayGroupMap>(new Map());
  const [selectedOption, setSelectedOption] = useState<string[]>(['default']);
  const [selectedRelay, setSelectedRelay] = useSelectedRelay(myPublicKey);

  const switchRelays = useMemo<SwitchRelays | undefined>(() => {
    const [mode, groupId] = selectedRelay;
    if (mode === RelayMode.rule) {
      return {
        id: mode,
        relays: [],
      };
    }
    if (mode === RelayMode.group && groupId) {
      const group = relayGroupMap.get(groupId);
      return {
        id: groupId,
        relays: group ?? [],
      };
    }
  }, [selectedRelay, relayGroupMap]);

  useEffect(() => {
    if (newConnCallback) {
      newConnCallback(newConn);
    }
  }, [newConn, newConnCallback]);

  useEffect(() => {
    if (wsStatusCallback) {
      wsStatusCallback(wsConnectStatus);
    }
  }, [wsConnectStatus, wsStatusCallback]);

  useEffect(() => {
    const defaultGroupId = 'default';
    const groups = new RelayGroup(myPublicKey);
    if (groups.getGroupById(defaultGroupId) == null && defaultGroup) {
      groups.setGroup(defaultGroupId, defaultGroup);
    }
    setRelayGroupMap(groups.map);
  }, [defaultGroup, myPublicKey]);

  // fetch nip-65 relay list group if it is not there
  useEffect(() => {
    if (!myPublicKey || myPublicKey.length === 0) return;
    if (!worker) return;

    const groups = new RelayGroup(myPublicKey);
    if (groups.getGroupById(NIP_65_RELAY_LIST)) return;

    const callRelay = createCallRelay(newConn);
    worker
      .subNip65RelayList({ pks: [myPublicKey], callRelay, limit: 1 })
      .iterating({
        cb: event => {
          groups.setGroup(NIP_65_RELAY_LIST, Nip65.toRelays(event));
          setRelayGroupMap(groups.map);
        },
      });
  }, [worker, newConn, myPublicKey]);

  const onChange = useCallback(
    (value: string[]) => {
      if (value.length === 1) {
        setSelectedOption(value);
        const [groupId] = value;
        setSelectedRelay([RelayMode.group, groupId]);
        return;
      }
      setSelectedRelay(value as [RelayMode, string]);
    },
    [setSelectedRelay],
  );

  return (
    <div className="flex px-4 mt-4">
      <Cascader
        options={[...initModeOptions(relayGroupMap)]}
        defaultValue={['default']}
        onChange={onChange}
        displayRender={(_: unknown, selectedOptions?: ICascaderOption[]) => {
          const [option] = selectedOptions ?? [];
          const group = option?.group;
          return (
            <div className="flex items-center gap-2">
              {group && (
                <div className="px-[6px] py-[2px] bg-surface-01-accent rounded">
                  <span className="text-text-primary text-sm font-noto">
                    {group}
                  </span>
                </div>
              )}
              <span className="text-text-primary text-sm font-noto">
                {toConnectStatus(
                  selectedOption,
                  wsConnectStatus,
                  worker?.relays?.length || 0,
                )}
              </span>
            </div>
          );
        }}
      />
    </div>
  );
}
