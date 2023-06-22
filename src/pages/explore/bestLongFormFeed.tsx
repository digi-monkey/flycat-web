import { UserMap } from 'core/nostr/type';
import { CallWorker } from 'core/worker/callWorker';
import { useBestLongFormFeed } from './hooks/useBestLongformFeed';
import PostItems from 'components/PostItems';

export const BestLongFormFeed = ({
  worker,
  newConn,
  userMap,
  setUserMap,
}: {
  worker?: CallWorker;
  newConn: string[];
  userMap: UserMap;
  setUserMap: any;
}) => {
  const feed = useBestLongFormFeed({ worker, newConn, userMap, setUserMap });
  return (
    <div>
      <PostItems
        msgList={feed}
        worker={worker!}
        userMap={userMap}
        relays={[]}
      />
    </div>
  );
};
