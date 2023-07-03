import { EventMap, UserMap } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { useBestLongFormFeed } from './hooks/useBestLongformFeed';
import PostItems from 'components/PostItems';
import { Dispatch, SetStateAction } from 'react';
import { useLastReplyEvent } from './hooks/useLastReplyEvent';

export const BestLongFormFeed = ({
  worker,
  newConn,
  userMap,
  setUserMap,
  eventMap,
  setEventMap
}: {
  worker?: CallWorker;
  newConn: string[];
  userMap: UserMap;
  setUserMap: Dispatch<SetStateAction<UserMap>>;
  eventMap: EventMap;
  setEventMap: Dispatch<SetStateAction<EventMap>>;
}) => {
  const feed = useBestLongFormFeed({ worker, newConn, userMap, setUserMap, setEventMap });
  useLastReplyEvent({msgList: feed, worker, userMap, setUserMap, setEventMap});
  return (
    <div>
      <PostItems
        msgList={feed}
        worker={worker!}
        userMap={userMap}
        relays={[]}
        eventMap={eventMap}
      />
    </div>
  );
};
