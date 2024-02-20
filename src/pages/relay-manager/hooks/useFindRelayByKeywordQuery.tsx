import { useRelayPool } from 'hooks/relay/useRelayManagerContext';
import { useQuery } from '@tanstack/react-query';

export default function useFindRelaysByKeywordQuery(
  keyword: string | undefined,
  page = 1,
  limit = 10,
) {
  const relayPool = useRelayPool();

  const queryResult = useQuery({
    enabled: typeof keyword === 'string' && keyword.length > 0,
    queryKey: ['allRelays', keyword, page, limit],
    queryFn: async () => {
      if (!keyword) return [[], 0];

      const relays = await relayPool.findRelays(keyword);
      const start = (page - 1) * limit;
      const end = start + limit;
      const relaysInPage = relays.slice(start, end);
      return [relaysInPage, relays.length];
    },
  });

  return queryResult;
}
