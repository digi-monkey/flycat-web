import { Relay } from 'core/relay/type';
import { useCallback } from 'react';
import { useQuery } from 'react-query';
import { useDefaultGroup } from './useDefaultGroup';
import { useRelayGroupManager } from './useRelayManagerContext';

export function useRelayGroupsQuery(pubkey: string) {
  const groupManager = useRelayGroupManager(pubkey);
  const defaultGroup = useDefaultGroup();

  const getRelayGroups = useCallback(async () => {
    const defaultGroupId = 'default';
    const hasDefaultGroup = await groupManager.getGroupById(defaultGroupId);
    if (!hasDefaultGroup && defaultGroup) {
      await groupManager.setGroup(defaultGroupId, defaultGroup);
    }

    const groupIds = await groupManager.getAllGroupIds();
    const groups = await Promise.all(
      groupIds.map(groupId => groupManager.getGroupById(groupId)),
    );

    return groupIds.reduce(
      (map, groupId, index) => {
        const relays = groups[index];
        if (relays) {
          map[groupId] = relays;
        }
        return map;
      },
      {} as Record<string, Relay[]>,
    );
  }, [groupManager, defaultGroup]);

  const queryResult = useQuery(['relayGroups', pubkey], getRelayGroups);
  return queryResult;
}
