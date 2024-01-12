import { Relay, RelayTracker } from 'core/relay/type';
import { useCallback, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  useRelayGroupManager,
  useRelayPoolDatabase,
} from './useRelayManagerContext';
import { Nip11 } from 'core/nip/11';

export function useRelaysQuery(pubkey: string, groupId: string) {
  const groupManager = useRelayGroupManager(pubkey);
  const relayPoolDatabse = useRelayPoolDatabase();

  const getRelays = useCallback(() => {
    const relays = groupManager.getGroupById(groupId);
    if (!relays) {
      return [];
    }

    return relays.map(r => {
      const relay = relayPoolDatabse.load(r.url);
      return relay || r;
    });
  }, [groupManager, groupId, relayPoolDatabse]);

  const queryResult = useQuery(['relays', pubkey, groupId], getRelays);
  const { data: relays = [] } = queryResult;

  useEffect(() => {
    const outdatedRelays = relays
      .filter(r => RelayTracker.isOutdated(r.lastAttemptNip11Timestamp))
      .map(r => r!.url);

    let newRelays: Relay[] = relays;
    if (outdatedRelays.length > 0) {
      Nip11.getRelays(outdatedRelays).then(details => {
        newRelays = relays.map(r => {
          if (details.map(d => d.url).includes(r.url)) {
            return details.filter(d => d.url === r.url)[0]!;
          } else {
            return r;
          }
        });

        if (newRelays.length > 0) {
          relayPoolDatabse.saveAll(newRelays);
          queryResult.refetch();
        }
      });
    }
  }, [queryResult, relays, relayPoolDatabse]);

  return queryResult;
}
