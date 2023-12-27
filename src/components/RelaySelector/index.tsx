import { Cascader } from 'components/shared/Cascader';
import { ICascaderOption } from 'components/shared/Cascader/type';
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
import { FiChevronDown } from 'react-icons/fi';
import { normalizeWsUrl } from 'utils/common';
import { useDefaultGroup } from '../../pages/relay-manager/hooks/useDefaultGroup';
import { useSelectedRelay } from './hooks/useSelectedRelay';
import { RelayFooterMenus, RelayMode, toLabel, toRelayMode } from './type';
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
  const [selectedRelay, setSelectedRelay] = useSelectedRelay(myPublicKey);

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

  const switchRelays = useMemo<SwitchRelays | undefined>(() => {
    const [mode, groupId] = selectedRelay;
    if (mode === RelayMode.Rule) {
      return {
        id: mode,
        relays: [],
      };
    }
    if (mode === RelayMode.Group && groupId) {
      const group = relayGroupMap.get(groupId);
      return {
        id: groupId,
        relays: group ?? [],
      };
    }
  }, [selectedRelay, relayGroupMap]);

  useEffect(() => {
    if (!switchRelays?.relays?.length || !worker) {
      return;
    }

    if (worker.relayGroupId !== switchRelays.id) {
      worker.switchRelays(switchRelays);
      worker.pullRelayInfo();
    }

    if (switchRelays?.relays) {
      const keys = Array.from(wsConnectStatus.keys());
      for (const key of keys) {
        if (
          !switchRelays.relays
            .map(r => normalizeWsUrl(r.url))
            .includes(normalizeWsUrl(key))
        ) {
          wsConnectStatus.delete(key);
        }
      }
    }
  }, [switchRelays, wsConnectStatus, worker]);

  useEffect(() => {
    worker?.addRelaySwitchAlert((data: RelaySwitchAlertMsg) => {
      if (
        worker?._portId === data.triggerByPortId ||
        worker?.relayGroupId === data.id
      ) {
        return;
      }
      const id = data.id;
      setSelectedRelay([RelayMode.Group, id]);
    });
  }, [worker, setSelectedRelay]);

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
    (_: string[], options: ICascaderOption[]) => {
      if (
        options.length === 1 &&
        options[0].value === RelayFooterMenus.ManageRelays
      ) {
        router.push(Paths.relayManager);
        return;
      }

      const mode =
        ((options.length > 1
          ? options[0].value
          : options[0]?.group) as RelayMode) ?? RelayMode.Group;
      const groupId = options.length > 1 ? options[1].value : options[0].value;
      setSelectedRelay([mode, groupId]);
    },
    [setSelectedRelay, router],
  );

  const value = useMemo(() => {
    const [mode, groupId] = selectedRelay;
    if (mode === RelayMode.Group && groupId) {
      return [groupId];
    }
    return ['default'];
  }, [selectedRelay]);

  return (
    <Cascader
      value={value}
      onChange={onChange}
      options={initModeOptions(relayGroupMap)}
      groupLabel={group => toLabel(toRelayMode(group))}
      displayRender={() => {
        const [mode, groupId] = selectedRelay;
        return (
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="px-[6px] py-[2px] bg-surface-01-accent rounded">
                <span className="text-text-primary text-sm font-noto whitespace-nowrap">
                  {mode ? toLabel(toRelayMode(mode)) : toLabel(RelayMode.Group)}
                </span>
              </div>
              <span className="text-text-primary text-sm font-noto whitespace-nowrap">
                {toConnectStatus(
                  groupId ?? 'default',
                  wsConnectStatus,
                  worker?.relays?.length || 0,
                )}
              </span>
            </div>
            <FiChevronDown className="w-5 h-5" />
          </div>
        );
      }}
    />
  );
}
