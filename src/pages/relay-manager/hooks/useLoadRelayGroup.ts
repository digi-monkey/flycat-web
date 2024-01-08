import { useEffect, useState } from 'react';
import { RelayGroup as RelayGroupClass } from 'core/relay/group';
import { Relay } from 'core/relay/type';

export function useRelayGroupState(myPublicKey: string, defaultGroup: Relay[]) {
  const [relayGroup, setRelayGroup] = useState<RelayGroupClass>();

  useEffect(() => {
    const groups = new RelayGroupClass(myPublicKey);
    const defaultGroupId = 'default';
    if (groups.getGroupById(defaultGroupId) === null && defaultGroup) {
      groups.setGroup(defaultGroupId, defaultGroup);
    }
    setRelayGroup(groups);
  }, [myPublicKey, defaultGroup]);
  return [relayGroup, setRelayGroup] as const;
}

export const updateGroupClassState = (
  oldGroups: RelayGroupClass,
  setGroups,
) => {
  setGroups(_prev => {
    const newClass = new RelayGroupClass(oldGroups.author);
    newClass.reInitGroups(oldGroups.map);
    return newClass;
  });
};
