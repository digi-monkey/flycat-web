import { dbEventTable, profileQuery } from 'core/db';
import { Nip23 } from 'core/nip/23';
import {
  EventId,
  PublicKey,
  EventTags,
  WellKnownEventKind,
} from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { EventWithSeen } from 'pages/type';
import { useEffect, useMemo } from 'react';

export function useLastReplyEvent({
  msgList,
  worker,
}: {
  msgList: EventWithSeen[];
  worker?: CallWorker;
}) {
  const list = useMemo(() => {
    return msgList;
  }, [msgList]);

  const subLastReply = async () => {
    if (!worker) return;
    if (list.length === 0) return;

    const replies = list
      .map(msgEvent => {
        const lastReply = msgEvent.tags
          .filter(t => t[0] === EventTags.E)
          .map(t => t[1] as EventId)
          .pop();
        if (lastReply) {
          return lastReply;
        }
        return null;
      })
      .filter(r => r != null)
      .map(r => r!);

    const articleReplies = list
      .map(msgEvent => {
        const lastReply = msgEvent.tags
          .filter(
            t =>
              t[0] === EventTags.A &&
              t[1].split(':')[0] === WellKnownEventKind.long_form.toString(),
          )
          .map(t => Nip23.addrToPkAndId(t[1]))
          .pop();
        if (lastReply) {
          return lastReply;
        }
        return null;
      })
      .filter(r => r != null)
      .map(r => r!);

    const newIds: EventId[] = [];
    for (const id of replies) {
      const isFound = await dbEventTable.get(id);
      if (!isFound) {
        newIds.push(id);
      }
    }

    const userPks = list
      .map(msgEvent => {
        const lastReply = msgEvent.tags
          .filter(t => t[0] === EventTags.P)
          .map(t => t[1] as PublicKey)
          .pop();
        if (lastReply) {
          return lastReply;
        }
        return null;
      })
      .filter(r => r != null)
      .map(r => r!);

    const newPks: PublicKey[] = [];
    for (const pk of userPks) {
      const isFound = await profileQuery.getProfileByPubkey(pk);
      if (!isFound) {
        newPks.push(pk);
      }
    }

    console.debug('sub reply: ', list.length, newIds.length, newPks.length);

    if (newIds.length > 0) {
      worker.subFilter({
        filter: {
          ids: newIds,
        },
        customId: 'replies-event',
      });
    }
    if (newPks.length > 0) {
      worker.subFilter({
        filter: { authors: newPks, kinds: [WellKnownEventKind.set_metadata] },
      });
    }

    if (articleReplies.length > 0) {
      worker.subFilter({
        filter: {
          '#d': articleReplies.map(a => a.articleId),
          authors: articleReplies.map(a => a.pubkey),
        },
        customId: 'last-replies-long-form',
      });
    }
  };

  useEffect(() => {
    subLastReply();
  }, [worker, list]);
}
