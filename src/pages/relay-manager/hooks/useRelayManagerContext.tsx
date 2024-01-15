import { RelayPool } from 'core/relay/pool';
import { useMemo, createContext, useContext } from 'react';
import { RelayGroupManager } from '../../../core/relay/group';
import { useDefaultGroup } from './useDefaultGroup';

type RelayManagerContextType = {
  managers: Map<string, RelayGroupManager>;
  relayPool: RelayPool;
};

const RelayManagerContext = createContext<RelayManagerContextType | null>(null);

export function RelayManagerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const managers = useMemo(() => new Map<string, RelayGroupManager>(), []);
  const relayPool = useMemo(() => new RelayPool(), []);
  const value = useMemo(() => ({ managers, relayPool }), [managers, relayPool]);
  return (
    <RelayManagerContext.Provider value={value}>
      {children}
    </RelayManagerContext.Provider>
  );
}

export function useRelayGroupManager(pubkey: string): RelayGroupManager {
  const context = useContext(RelayManagerContext);
  const defaultGroup = useDefaultGroup();

  const manager = useMemo(() => {
    let manager = context?.managers.get(pubkey);
    if (!manager) {
      manager = new RelayGroupManager(pubkey);

      context?.managers.set(pubkey, manager);
    }

    const defaultGroupId = 'default';
    if (manager.getGroupById(defaultGroupId) === null && defaultGroup) {
      manager.setGroup(defaultGroupId, defaultGroup);
    }
    return manager;
  }, [pubkey, context?.managers, defaultGroup]);
  return manager;
}

export function useRelayPool() {
  const context = useContext(RelayManagerContext);
  return context!.relayPool;
}
