import { isEventSubResponse } from 'service/nostr/util';
import {
  EventSubResponse,
  WellKnownEventKind
} from 'service/nostr/type';
import { Event } from 'service/nostr/Event';
import { Nip51 } from 'service/nip/51';
import { CallWorker } from 'service/worker/callWorker';

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
