import { isEventSubResponse } from 'core/nostr/util';
import {
  EventSubResponse,
  WellKnownEventKind
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { Nip51 } from 'core/nip/51';
import { CallWorker } from 'core/worker/caller';

export async function fetchPublicBookmarkListEvent(
  myPublicKey: string,
  worker: CallWorker,
): Promise<Event | null> {
  const filter = Nip51.createPublicBookmarkListFilter(myPublicKey);
  const handler = await worker.subFilter(filter);
  const iterator = handler!.getIterator();

  let result: Event | null = null;

  while (true) {
		const data = await iterator.next();
		if (data?.done) {
			break;
		} else {
			const res = data?.value;
			if (res == null) continue;
			const msg = JSON.parse(res.nostrData); //todo: callback other datatype as well
			if (isEventSubResponse(msg)) {
				const event = (msg as EventSubResponse)[2];

				if (event.kind !== WellKnownEventKind.bookmark_list) continue;

				if (!result) {
					result = event;
				}

				if (result && result.created_at < event.created_at) {
					result = event;
				}
			}
		}
	}

  return result;
}
