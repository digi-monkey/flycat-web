import { UserMap } from 'core/nostr/type';
import { CallWorker } from 'core/worker/callWorker';
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
