import { RelayTracker } from 'core/relay/type';
import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRelayGroupManager } from './useRelayManagerContext';
import { Nip11 } from 'core/nip/11';
import { RelayPoolDatabase } from 'core/relay/pool/db';
import { useRelayGroupsQuery } from './useRelayGroupsQuery';

export function useRelaysQuery(pubkey: string, groupId: string) {
  const groupManager = useRelayGroupManager(pubkey);
  const relayPoolDatabase = useMemo(() => new RelayPoolDatabase(), []);
  const { data: relayGroups } = useRelayGroupsQuery(pubkey);

  const getRelays = useCallback(async () => {
    const group = await groupManager.getGroupById(groupId);
    if (!group) {
      return [];
    }

    return group.relays.map(r => {
      const relay = relayPoolDatabase.load(r.url);
      return relay || r;
    });
  }, [groupManager, groupId, relayPoolDatabase]);

  const queryResult = useQuery({
    queryKey: ['relays', pubkey, groupId],
    queryFn: getRelays,
  });

  const outdatedRelays = useMemo(() => {
    return queryResult.data
      ?.filter(r => RelayTracker.isOutdated(r.lastAttemptNip11Timestamp))
      .map(r => r!.url);
  }, [queryResult.data]);

  const getOutdatedRelays = useCallback(async () => {
    if (!outdatedRelays || outdatedRelays.length === 0) return [];

    const newRelays = await Nip11.getRelays(outdatedRelays);

    if (newRelays.length > 0) {
      relayPoolDatabase.saveAll(newRelays);
    }

    return newRelays;
  }, [outdatedRelays]);

  const updateOutdatedRelayResult = useQuery({
    queryKey: ['outdatedRelay', pubkey, outdatedRelays],
    queryFn: getOutdatedRelays,
  });

  useEffect(() => {
    if (!relayGroups) {
      return;
    }
    const group = relayGroups[groupId];
    const relays = queryResult.data || [];
    if (group?.relays && group.relays.length !== relays.length) {
      queryResult.refetch();
    }
  }, [relayGroups, groupId, queryResult]);

  const data = useMemo(() => {
    const relays = queryResult.data;
    const updateRelays = updateOutdatedRelayResult.data;
    if (updateRelays && updateRelays.length > 0) {
      const duplicate = updateRelays.map(r => r.url);
      return [
        ...updateRelays,
        ...(relays?.filter(r => !duplicate.includes(r.url)) || []),
      ];
    }

    return relays;
  }, [queryResult.data, updateOutdatedRelayResult.data]);

  const refetch = queryResult.refetch;
  return { data, refetch };
}
