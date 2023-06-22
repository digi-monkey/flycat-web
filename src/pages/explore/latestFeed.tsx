import { UserMap } from 'service/nostr/type';
import { CallWorker } from 'service/worker/callWorker';
import { useLatestFeed } from './hooks/useLatestFeed';
import PostItems from 'components/PostItems';

export const LatestFeed = ({
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
  const feed = useLatestFeed({ worker, newConn, userMap, setUserMap });
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
