import { isEventSubResponse } from 'core/nostr/util';
import { Filter, EventSubResponse } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { Pool } from 'core/backend/pool';
import { waitUntilNip23RelayConnected, timeout } from 'core/backend/util';
import { seedRelays } from 'core/relay/pool/seed';

export const callSubFilter = async ({
  filter,
  timeoutMs = 3000,
  eventLimit = 1000,
}: {
  filter: Filter;
  timeoutMs?: number;
  eventLimit?: number;
}) => {
  // vercel will make each api handler as a serverless function,
  // so no need to reuse pool instance
  const pool = new Pool(seedRelays);
  try {
    await waitUntilNip23RelayConnected(pool);
  } catch (error) {
    console.debug('wait for at least one connect but time out');
  }
  const sub = pool.subFilter({ filter });
  const iterator = sub.getIterator();
  let events: Event[] = [];

  while (true) {
    if (events.length >= eventLimit) {
      break;
    }
    const promise = Promise.race([iterator.next(), timeout(timeoutMs)]);
    try {
      const result = await promise;
      if (result.done) {
        // If the iterator is done, break out of the loop
        break;
      }
      const value = result.value;
      const msg = JSON.parse(value.nostrData);
      if (isEventSubResponse(msg)) {
        const event = (msg as EventSubResponse)[2];
        if (!events.map(e => e.id).includes(event.id)) {
          // do not add duplicated msg
          const newItems = [...events, event];
          // sort by timestamp
          const sortedItems = newItems.sort((a, b) =>
            a.created_at >= b.created_at ? -1 : 1,
          );
          events = sortedItems;
        }
      }
    } catch (err) {
      break;
    }
  }

  pool.close();

  console.debug('get events: ', events.length);
  return events;
};
