import { Cascader } from 'components/shared/Cascader';
import { ICascaderOption } from 'components/shared/Cascader/type';
import { Paths } from 'constants/path';
import { v4 as uuidv4 } from 'uuid';
import { NIP_65_RELAY_LIST } from 'constants/relay';
import { Nip65 } from 'core/nip/65';
import { RelaySwitchAlertMsg } from 'core/worker/type';
import { createCallRelay } from 'core/worker/util';
import { useRelayGroupsQuery } from 'hooks/relay/useRelayGroupsQuery';
import { useRelayGroupManager } from 'hooks/relay/useRelayManagerContext';
import { useSelectedRelayGroup } from 'hooks/relay/useSelectedRelayGroup';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo } from 'react';
import { FaChevronDown } from 'react-icons/fa6';
import { normalizeWsUrl } from 'utils/common';
import { RelayFooterMenus, RelayMode, toLabel, toRelayMode } from './type';
import { initModeOptions, toConnectStatus } from './util';
import { isValidPublicKey } from 'utils/validator';
import dynamic from 'next/dynamic';

export interface RelaySelectorProps {
  className?: string;
}

export interface Option {
  value: string;
  label: string;
  children?: Option[];
}

function RelaySelector() {
  const { worker, newConn, wsConnectStatus } = useCallWorker();
  const router = useRouter();
  const myPublicKey = useReadonlyMyPublicKey();
  const { data: relayGroups = {}, refetch: refetchRelayGroups } =
    useRelayGroupsQuery(myPublicKey);
  const relayGroupManager = useRelayGroupManager(myPublicKey);
  const [selectedRelayGroup, setSelectedRelayGroup] = useSelectedRelayGroup();

  useEffect(() => {
    if (!selectedRelayGroup?.relays?.length || !worker) {
      return;
    }

    if (worker.relayGroupId !== selectedRelayGroup.id) {
      worker.switchRelays(selectedRelayGroup);
      worker.pullRelayInfo();
    }

    if (selectedRelayGroup?.relays) {
      const keys = Array.from(wsConnectStatus.keys());
      for (const key of keys) {
        if (
          !selectedRelayGroup.relays
            .map(r => normalizeWsUrl(r.url))
            .includes(normalizeWsUrl(key))
        ) {
          wsConnectStatus.delete(key);
        }
      }
    }
  }, [selectedRelayGroup, wsConnectStatus, worker, relayGroups]);

  useEffect(() => {
    worker?.addRelaySwitchAlert((data: RelaySwitchAlertMsg) => {
      if (
        worker?._portId === data.triggerByPortId ||
        worker?.relayGroupId === data.id
      ) {
        return;
      }
      const id = data.id;
      setSelectedRelayGroup(id);
    });
  }, [worker, setSelectedRelayGroup]);

  useEffect(() => {
    if (!isValidPublicKey(myPublicKey) || !worker) {
      return;
    }
    Promise.all([
      relayGroupManager.subNip65RelayList(),
      relayGroupManager.subNip51RelaySet(),
    ]).then(() => {
      refetchRelayGroups();
    });
  }, [worker, myPublicKey, refetchRelayGroups, relayGroupManager, relayGroups]);

  const onChange = useCallback(
    (_: string[], options: ICascaderOption[]) => {
      if (
        options.length === 1 &&
        options[0].value === RelayFooterMenus.ManageRelays
      ) {
        router.push(Paths.relayManager);
        return;
      }

      const groupId = options.length > 1 ? options[1].value : options[0].value;
      setSelectedRelayGroup(groupId);
    },
    [setSelectedRelayGroup, router],
  );

  const value = useMemo(() => {
    return selectedRelayGroup.id ? [selectedRelayGroup.id] : ['default'];
  }, [selectedRelayGroup]);

  return (
    <Cascader
      value={value}
      onChange={onChange}
      options={initModeOptions(relayGroups ?? {})}
      groupLabel={group => toLabel(toRelayMode(group))}
      displayRender={() => {
        const group = relayGroups?.[selectedRelayGroup.id];
        return (
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="px-[6px] py-[2px] bg-surface-01-accent rounded">
                <span className="text-text-primary text-sm font-noto whitespace-nowrap">
                  {toLabel(RelayMode.Group)}
                </span>
              </div>
              <span
                className="text-text-primary text-sm font-noto whitespace-nowrap"
                suppressHydrationWarning
              >
                {toConnectStatus(
                  group?.title ?? 'default',
                  wsConnectStatus,
                  selectedRelayGroup.relays?.length || 0,
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

export default dynamic(() => Promise.resolve(RelaySelector), {
  ssr: false,
});
