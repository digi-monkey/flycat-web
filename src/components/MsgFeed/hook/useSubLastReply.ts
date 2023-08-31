import { Nip23 } from 'core/nip/23';
import { deserializeMetadata } from 'core/nostr/content';
import {
  UserMap,
  EventMap,
  EventId,
  PublicKey,
  EventTags,
  WellKnownEventKind,
  EventSetMetadataContent,
} from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { EventWithSeen } from 'pages/type';
import { Dispatch, SetStateAction, useEffect, useMemo } from 'react';

export function useLastReplyEvent({
  msgList,
  worker,
}: {
  msgList: EventWithSeen[];
  worker?: CallWorker;
}) {
  const subEvent: EventId[] = msgList.map(e => e.id);
  const subPks: PublicKey[] = [];
  
  const list = useMemo(()=>{return msgList}, [msgList.length]);

  useEffect(() => {
    if (!worker) return;
    if(msgList.length === 0)return;

    const replies = msgList
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

    const articleReplies = msgList
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

    const newIds = replies.filter(id => !subEvent.includes(id));

    const userPks = msgList
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

    const newPks = userPks.filter(pk => !subPks.includes(pk));

    console.debug("sub reply", msgList.length, newIds.length, newPks.length);

    worker
      .subFilter({
        filter: {
          ids: newIds,
        },
        customId: 'replies-user',
      })

    if (articleReplies.length > 0) {
      worker
        .subFilter({
          filter: {
            '#d': articleReplies.map(a => a.articleId),
            authors: articleReplies.map(a => a.pubkey),
          },
          customId: 'last-replies-long-form',
        })
    }

    worker
      .subFilter({
        filter: { authors: newPks, kinds: [WellKnownEventKind.set_metadata] },
      })

    subEvent.push(...newIds);
    subPks.push(...newPks);
  }, [worker, list]);
}
