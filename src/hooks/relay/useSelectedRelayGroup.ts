import { useMutation, useQuery } from '@tanstack/react-query';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useRelayGroupsQuery } from './useRelayGroupsQuery';
import { useCallback } from 'react';

const SELECTED_RELAY_GROUP_ID_KEY =
  'relay-selector:selected-group-id:{{pubKey}}';

const getLegacyLocalValue = (key: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  const jsonVal = localStorage.getItem(key);
  if (jsonVal) {
    try {
      const value = JSON.parse(jsonVal);
      return value;
    } catch (e) {
      localStorage.setItem(key, JSON.stringify(jsonVal));
      return jsonVal;
    }
  }
};

export function useSelectedRelayGroup() {
  const myPublicKey = useReadonlyMyPublicKey();
  const { data: relayGroups } = useRelayGroupsQuery(myPublicKey);
  const { data: selectedGroupId = 'default', refetch } = useQuery({
    queryKey: ['selected-relay-group', myPublicKey],
    queryFn: () => {
      return getLegacyLocalValue(SELECTED_RELAY_GROUP_ID_KEY);
    },
  });

  const group = relayGroups?.[selectedGroupId];
  const selectedRelayGroup = {
    id: group?.id ?? 'default',
    relays: group?.relays ?? [],
  };

  const mutation = useMutation({
    mutationFn: async (groupId: string) => {
      localStorage.setItem(
        SELECTED_RELAY_GROUP_ID_KEY,
        JSON.stringify(groupId),
      );
      refetch();
    },
  });
  const setSelectedRelayGroup = useCallback(
    (groupId: string) => {
      mutation.mutate(groupId);
    },
    [mutation],
  );
  return [selectedRelayGroup, setSelectedRelayGroup] as const;
}
