import { WellKnownEventKind } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { Nip51 } from 'core/nip/51';
import { CallWorker } from 'core/worker/caller';

export async function fetchPublicBookmarkListEvent(
  myPublicKey: string,
  worker: CallWorker,
): Promise<Event | null> {
  const filter = Nip51.createPublicBookmarkListFilter(myPublicKey);
  const handler = worker.subFilter({ filter });
  const iterator = handler.getIterator();

  let result: Event | null = null;

  for await (const data of iterator) {
    const event = data.event;

    if (event.kind !== WellKnownEventKind.bookmark_list) continue;

    if (!result) {
      result = event;
    }

    if (result && result.created_at < event.created_at) {
      result = event;
    }
  }
  iterator.unsubscribe();

  return result;
}
