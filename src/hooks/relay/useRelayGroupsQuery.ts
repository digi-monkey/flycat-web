import { RelayGroup } from 'core/relay/group/type';
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDefaultRelays } from './useDefaultRelays';
import { useRelayGroupManager } from './useRelayManagerContext';

export function useRelayGroupsQuery(pubkey: string) {
  const groupManager = useRelayGroupManager(pubkey);
  const defaultGroup = useDefaultRelays();

  const getRelayGroups = useCallback(async () => {
    const defaultGroupId = 'default';
    const hasDefaultGroup = await groupManager.getGroupById(defaultGroupId);

    if (!hasDefaultGroup && defaultGroup) {
      await groupManager.setGroup(defaultGroupId, {
        id: defaultGroupId,
        title: 'Default',
        relays: defaultGroup,
        timestamp: 0,
      });
    }

    const groupIds = await groupManager.getAllGroupIds();
    const groups = await Promise.all(
      groupIds.map(groupId => groupManager.getGroupById(groupId)),
    );

    return groups
      .filter(g => !!g)
      .reduce(
        (map, group) => {
          map[group!.id] = group as RelayGroup;
          return map;
        },
        {} as Record<string, RelayGroup>,
      );
  }, [groupManager, defaultGroup]);

  const queryResult = useQuery({
    queryKey: ['relayGroups', pubkey],
    queryFn: getRelayGroups,
    refetchOnWindowFocus: true,
  });
  return queryResult;
}
