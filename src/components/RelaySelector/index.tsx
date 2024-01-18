import { Cascader } from 'components/shared/Cascader';
import { ICascaderOption } from 'components/shared/Cascader/type';
import { Paths } from 'constants/path';
import { NIP_65_RELAY_LIST } from 'constants/relay';
import { Nip65 } from 'core/nip/65';
import {
  RelaySwitchAlertMsg,
  SwitchRelays,
  WsConnectStatus,
} from 'core/worker/type';
import { createCallRelay } from 'core/worker/util';
import { useRelayGroupsQuery } from 'hooks/relay/useRelayGroupsQuery';
import { useRelayGroupManager } from 'hooks/relay/useRelayManagerContext';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo } from 'react';
import { FaChevronDown } from 'react-icons/fa6';
import { normalizeWsUrl } from 'utils/common';
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
  const { data: relayGroups, refetch: refetchRelayGroups } =
    useRelayGroupsQuery(myPublicKey);
  const relayGroupManager = useRelayGroupManager(myPublicKey);
  const [selectedRelay, setSelectedRelay] = useSelectedRelay();

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
      const group = relayGroups?.[groupId];
      return {
        id: groupId,
        relays: group ?? [],
      };
    }
  }, [selectedRelay, relayGroups]);

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

  // fetch nip-65 relay list group if it is not there
  useEffect(() => {
    if (!myPublicKey || myPublicKey.length === 0 || !worker || !relayGroups)
      return;

    if (relayGroups[NIP_65_RELAY_LIST]) return;
    const callRelay = createCallRelay(newConn);
    worker
      .subNip65RelayList({ pks: [myPublicKey], callRelay, limit: 1 })
      .iterating({
        cb: async event => {
          await relayGroupManager.setGroup(
            NIP_65_RELAY_LIST,
            Nip65.toRelays(event),
          );
          refetchRelayGroups();
        },
      });
  }, [
    worker,
    newConn,
    myPublicKey,
    relayGroups,
    refetchRelayGroups,
    relayGroupManager,
  ]);

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
      options={initModeOptions(relayGroups ?? {})}
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
              <span
                className="text-text-primary text-sm font-noto whitespace-nowrap"
                suppressHydrationWarning
              >
                {toConnectStatus(
                  groupId ?? 'default',
                  wsConnectStatus,
                  worker?.relays?.length || 0,
                )}
              </span>
            </div>
            <FaChevronDown className="w-5 h-5" />
          </div>
        );
      }}
    />
  );
}
