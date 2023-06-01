import {
  Event,
  isEventSubResponse,
  EventSubResponse,
  WellKnownEventKind,
} from 'service/api';
import { Nip51 } from 'service/nip/51';
import { CallWorker } from 'service/worker/callWorker';

export async function fetchPublicBookmarkListEvent(
  myPublicKey: string,
  worker: CallWorker,
  timeoutMs = 2000,
): Promise<Event | null> {
  const filter = Nip51.createPublicBookmarkListFilter(myPublicKey);
  const handler = await worker.subFilter(filter);
  const iterator = handler!.getIterator();

  let result: Event | null = null;

	// todo: fix the iterator with correct stoppers to remove the manual timeout
  const timeoutPromise = new Promise<Event | null>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Timeout'));
    }, timeoutMs);
  });

  try {
    await Promise.race([
      timeoutPromise,
			(async () => {
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
			})()
    ]);
  } catch (error) {
    // Handle the timeout error here if needed
    console.log('Timeout occurred:', error);
  }

  return result;
}
