import { Relay } from 'core/relay/type';
import { useRelayPool } from 'hooks/relay/useRelayManagerContext';
import { useRef } from 'react';
import { useQuery } from 'react-query';

export default function useAllRelaysByPageQuery(page = 1, limit = 10) {
  const relayPool = useRelayPool();
  const relaysCacheRef = useRef<Relay[]>([]);

  const queryResult = useQuery(
    ['allRelays', page, limit],
    async () => {
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
    {
      keepPreviousData: true,
    },
  );

  return queryResult;
}

export function useGetAllRelaysCountQuery() {
  const relayPool = useRelayPool();
  const queryResult = useQuery(['allRelaysCount'], async () => {
    const relays = await relayPool.getAllRelays();
    return relays.length;
  });

  return queryResult;
}
