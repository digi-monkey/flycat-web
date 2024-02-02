import { useQuery } from '@tanstack/react-query';
import { profileQuery } from 'core/db';
import { deserializeMetadata } from 'core/nostr/content';
import { PublicKey } from 'core/nostr/type';
import { useCallback } from 'react';

export function useProfiles(pks: PublicKey[]) {
  const getProfiles = useCallback(async () => {
    const profiles = await profileQuery.getBatchProfiles(pks);
    return profiles.map(p => {
      return { ...deserializeMetadata(p.content), ...{ pubkey: p.pubkey } };
    });
  }, [pks]);

  const queryResult = useQuery({
    queryKey: ['useProfiles', pks],
    queryFn: getProfiles,
  });

  return queryResult;
}
