import { Relay } from 'core/relay/type';
import { useRelayPool } from 'hooks/relay/useRelayManagerContext';
import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function useAllRelaysByPageQuery(page = 1, limit = 10) {
  const relayPool = useRelayPool();
  const relaysCacheRef = useRef<Relay[]>([]);

  const queryResult = useQuery({
    queryKey: ['allRelays', page, limit],
    queryFn: async () => {
      let relays = relaysCacheRef.current;
      if (relays.length === 0) {
        relays = await relayPool.getAllRelays();
        relaysCacheRef.current = relays;
      }

      const start = (page - 1) * limit;
      const end = start + limit;
      const relaysInPage = relays.slice(start, end);
      return relaysInPage;
    },
  });

  return queryResult;
}

export function useGetAllRelaysCountQuery() {
  const relayPool = useRelayPool();
  const queryResult = useQuery({
    queryKey: ['allRelaysCount'],
    queryFn: async () => {
      const relays = await relayPool.getAllRelays();
      return relays.length;
    },
  });

  return queryResult;
}
