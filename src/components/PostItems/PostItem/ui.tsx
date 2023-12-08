import { Event } from 'core/nostr/Event';
import { CallWorker } from 'core/worker/caller';
import { toUnSeenEvent } from 'core/nostr/util';
import { PostCommunityHeader } from '../PostCommunityHeader';
import { message } from 'antd';
import { DbEvent } from 'core/db/schema';
import { EventSetMetadataContent } from 'core/nostr/type';

import styles from '../index.module.scss';
import dynamic from 'next/dynamic';

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
    onClick: (event: Event, msg: typeof message) => any;
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
}) => (
  <div className={styles.post} key={event.id}>
    {extraHeader}
    {showFromCommunity && <PostCommunityHeader event={event} />}
    <PostUser
      publicKey={event.pubkey}
      profile={profile}
      event={event}
      extraMenu={extraMenu}
    />
    <div className={styles.content}>
      {content}
      <PostReactions
        ownerEvent={toUnSeenEvent(event)}
        worker={worker}
        seen={event.seen!}
      />
    </div>
  </div>
);
