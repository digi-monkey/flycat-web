import { useEffect } from 'react';
import { RelayGroup as RelayGroupClass } from 'core/relay/group';

export function useLoadRelayGroup({ myPublicKey, defaultGroup, setGroups }) {
  useEffect(() => {
    const groups = new RelayGroupClass(myPublicKey);
    const defaultGroupId = 'default';
    if (groups.getGroupById(defaultGroupId) == null && defaultGroup) {
      groups.setGroup(defaultGroupId, defaultGroup);
    }
    setGroups(groups);
  }, [myPublicKey, defaultGroup]);
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
