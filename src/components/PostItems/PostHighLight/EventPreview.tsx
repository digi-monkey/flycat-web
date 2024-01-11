import { dbEventTable } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { EventId } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export interface EventPreviewProp {
  eventId: EventId;
  worker: CallWorker | undefined;
}

export const EventPreview: React.FC<EventPreviewProp> = ({
  eventId,
  worker,
}) => {
  const [event, setEvent] = useState<DbEvent>();

  useEffect(() => {
    if (!eventId) return;
    if (event) return;

    dbEventTable.get(eventId).then(res => {
      if (res) {
        setEvent(res);
      } else {
        worker?.subMsgByEventIds([eventId]).iterating({
          cb: e => {
            setEvent(e as DbEvent);
          },
        });
      }
    });
  }, [worker, eventId, dbEventTable]);

  return (
    <Link href={'event/' + eventId}>{event?.content.slice(0, 140)}..</Link>
  );
};

export default EventPreview;
