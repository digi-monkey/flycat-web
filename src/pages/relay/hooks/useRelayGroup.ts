import { useEffect, useState } from 'react';
import { RelayGroup } from 'service/relay/group';
import { Relay } from 'service/relay/type';

export function useRelayGroup(myPublicKey: string, defaultGroup?: Relay[]) {
  const [groups, setGroups] = useState<RelayGroup>();

  useEffect(() => {
    const groups = new RelayGroup(myPublicKey);
		const defaultGroupId = "default";
    if (groups.getGroupById(defaultGroupId) == null && defaultGroup) {
      groups.setGroup(defaultGroupId, defaultGroup);
    }
    setGroups(groups);
  }, [myPublicKey, defaultGroup]);

  return groups;
}
