import { Relay } from 'core/relay/type';
import { useCallback } from 'react';
import { useQuery } from 'react-query';
import { useRelayGroupManager } from './useRelayManagerContext';

export function useRelayGroupQuery(pubkey: string) {
  const groupManager = useRelayGroupManager(pubkey);

  const getRelayGroups = useCallback(() => {
    const groupIds = groupManager.getAllGroupIds();
    return groupIds.reduce(
      (map, groupId) => {
        const relays = groupManager.getGroupById(groupId);
        if (relays) {
          map[groupId] = relays;
        }
        return map;
      },
      {} as Record<string, Relay[]>,
    );
  }, [groupManager]);

  const queryResult = useQuery(['relayGroups', pubkey], getRelayGroups);
  return queryResult;
}
