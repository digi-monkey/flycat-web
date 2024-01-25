import { RelayGroupManager } from 'core/relay/group';
import { RelayPool } from 'core/relay/pool';
import { useCallWorker } from 'hooks/useWorker';
import { useMemo, createContext, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';

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
  const { worker } = useCallWorker();
  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );

  const manager = useMemo(() => {
    let manager = context?.managers.get(pubkey);
    if (!manager) {
      manager = new RelayGroupManager(pubkey, worker!, signEvent);
      context?.managers.set(pubkey, manager);
    }
    return manager;
  }, [pubkey, context?.managers, worker, signEvent]);

  return manager;
}

export function useRelayPool() {
  const context = useContext(RelayManagerContext);
  return context!.relayPool;
}
