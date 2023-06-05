import { Msgs } from 'components/layout/msg/Msg';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import { useBestLongFormFeed } from './hooks/useBestLongformFeed';

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
  return <div>{Msgs(feed, worker!, userMap, [])}</div>;
};
