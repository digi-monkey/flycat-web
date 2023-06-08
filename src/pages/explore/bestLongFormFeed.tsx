import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
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
