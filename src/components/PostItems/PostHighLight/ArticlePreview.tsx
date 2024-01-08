import { dbEventTable, dbQuery } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { Nip23 } from 'core/nip/23';
import { EventId, Filter, Naddr } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export interface ArticlePreviewProp {
  naddr: Naddr;
  worker: CallWorker | undefined;
}

export const ArticlePreview: React.FC<ArticlePreviewProp> = ({
  naddr,
  worker,
}) => {
  const [event, setEvent] = useState<DbEvent>();

  useEffect(() => {
    if (!naddr) return;
    if (event) return;

    // todo: make naddr a primary key in local db
    const { pubkey, articleId } = Nip23.addrToPkAndId(naddr);
    const filter: Filter = {
      '#d': [articleId],
      authors: [pubkey],
      kinds: [Nip23.kind],
    };
    dbQuery.matchFilterRelay(filter, []).then(res => {
      if (res.length > 0) {
        setEvent(res[0]);
      } else {
        worker?.subFilter({ filter }).iterating({
          cb: e => {
            setEvent(e as DbEvent);
          },
        });
      }
    });
  }, [worker, naddr, dbEventTable]);

  const article = useMemo(() => {
    if (event) {
      return Nip23.toArticle(event);
    }
    return null;
  }, [event]);

  return <Link href={'event/' + event?.id}>{article?.title}</Link>;
};

export default ArticlePreview;
