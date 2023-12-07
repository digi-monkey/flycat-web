import { Event } from 'core/nostr/Event';
import { CallWorker } from 'core/worker/caller';
import { message } from 'antd';
import { useLiveQuery } from 'dexie-react-hooks';
import { dexieDb } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { deserializeMetadata } from 'core/nostr/content';
import { PostItem } from './PostItem';
import { EventWithSeen } from 'pages/type';

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
}

const PostItems: React.FC<PostItemsProps> = ({
  msgList,
  worker,
  showLastReplyToEvent = true,
  showFromCommunity = true,
  extraMenu,
  extraHeader,
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

  const getUser = (pubkey: string) => {
    const user = profileEvents.find(e => e.pubkey === pubkey);
    if (user) {
      return deserializeMetadata(user.content);
    }
    return null;
  };

  return (
    <>
      {msgList.map(msg => (
        <PostItem
          key={msg.id}
          profile={getUser(msg.pubkey)}
          event={msg}
          worker={worker}
          showLastReplyToEvent={showLastReplyToEvent}
          showFromCommunity={showFromCommunity}
          extraMenu={extraMenu}
          extraHeader={extraHeader}
        />
      ))}
    </>
  );
};

export default PostItems;
