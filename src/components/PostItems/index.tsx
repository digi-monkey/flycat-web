import { Event } from 'core/nostr/Event';
import { CallWorker } from 'core/worker/caller';
import { message } from 'antd';
import { useLiveQuery } from 'dexie-react-hooks';
import { dexieDb } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { deserializeMetadata } from 'core/nostr/content';
import { EventWithSeen } from 'pages/type';
import LazyLoad from 'react-lazyload';
import dynamic from 'next/dynamic';
import { useCallback } from 'react';

const PostItem = dynamic(
  async () => {
    const mod = await import('./PostItem');
    return mod.PostItem;
  },
  { loading: () => <p>Loading Post...</p>, ssr: false, suspense: true },
);

interface PostItemsProps {
  msgList: DbEvent[] | EventWithSeen[];
  worker: CallWorker;
  showLastReplyToEvent?: boolean;
  showFromCommunity?: boolean;
  extraMenu?: {
    label: string;
    onClick: (event: Event, msg: typeof message) => any;
  }[];
  extraHeader?: React.ReactNode;
  truncate?: boolean;
}

const PostItems: React.FC<PostItemsProps> = ({
  msgList,
  worker,
  showLastReplyToEvent = true,
  showFromCommunity = true,
  extraMenu,
  extraHeader,
  truncate = true,
}) => {
  const profileEvents = useLiveQuery(
    async () => {
      const events = await dexieDb.profileEvent.bulkGet(
        msgList.map(m => m.pubkey),
      );
      return events.filter(e => e != null) as DbEvent[];
    },
    [msgList],
    [] as DbEvent[],
  );

  const getUser = useCallback(
    (pubkey: string) => {
      const user = profileEvents.find(e => e.pubkey === pubkey);
      if (user) {
        return deserializeMetadata(user.content);
      }
      return null;
    },
    [profileEvents],
  );

  return (
    <>
      {msgList.map(msg => (
        <LazyLoad height={350} once key={msg.id}>
          <PostItem
            profile={getUser(msg.pubkey)}
            event={msg}
            worker={worker}
            showLastReplyToEvent={showLastReplyToEvent}
            showFromCommunity={showFromCommunity}
            extraMenu={extraMenu}
            extraHeader={extraHeader}
            truncate={truncate}
          />
        </LazyLoad>
      ))}
    </>
  );
};

export default PostItems;
