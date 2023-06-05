import { Msgs } from 'components/layout/msg/Msg';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import { useLatestFeed } from './hooks/useLatestFeed';

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
  return <div>{Msgs(feed, worker!, userMap, [])}</div>;
};
