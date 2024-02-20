import { Event } from 'core/nostr/Event';
import { CallWorker } from 'core/worker/caller';
import { toUnSeenEvent } from 'core/nostr/util';
import { PostCommunityHeader } from '../PostCommunityHeader';
import { DbEvent } from 'core/db/schema';
import { EventSetMetadataContent } from 'core/nostr/type';
import { cn } from 'utils/classnames';
import { noticePubEventResult } from 'components/PubEventNotice';

import styles from '../index.module.scss';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useToast } from 'components/shared/ui/Toast/use-toast';

const PostUser = dynamic(
  async () => {
    return await import('../PostUser');
  },
  {
    loading: () => <p>Loading PostUser...</p>,
    ssr: false,
    suspense: true,
  },
);

const PostReactions = dynamic(
  async () => {
    return await import('../PostReactions/index');
  },
  {
    loading: () => <p>Loading PostReactions...</p>,
    ssr: false,
    suspense: true,
  },
);

export interface PostUIProp {
  content: JSX.Element;
  profile: EventSetMetadataContent | null;
  event: DbEvent;
  worker: CallWorker;
  showFromCommunity?: boolean;
  extraMenu?: {
    label: string;
    onClick: (event: Event) => any;
  }[];
  extraHeader?: React.ReactNode;
}

export const PostUI: React.FC<PostUIProp> = ({
  content,
  profile,
  event,
  worker,
  extraMenu,
  extraHeader,
  showFromCommunity,
}) => {
  const { toast } = useToast();
  const menu = useMemo(() => {
    const onBroadcastEvent = async (event: Event) => {
      if (!worker)
        return toast({ title: 'worker not found.', status: 'error' });
      const pubHandler = worker.pubEvent(event);
      noticePubEventResult(toast, worker.relays.length, pubHandler);
    };
    const menu = [
      {
        label: 'broadcast',
        onClick: onBroadcastEvent,
      },
    ];
    if (extraMenu) {
      menu.concat(extraMenu);
    }
    return menu;
  }, [extraMenu]);

  return (
    <div className={styles.post} key={event.id}>
      {extraHeader}
      {showFromCommunity && <PostCommunityHeader event={event} />}
      <PostUser
        publicKey={event.pubkey}
        profile={profile}
        event={event}
        extraMenu={menu}
      />
      <div className={cn(styles.content)}>
        {content}
        <PostReactions
          ownerEvent={toUnSeenEvent(event)}
          worker={worker}
          seen={event.seen!}
        />
      </div>
    </div>
  );
};
