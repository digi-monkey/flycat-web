import { Nip23 } from 'core/nip/23';
import { Nip9802 } from 'core/nip/9802';
import { EventMap, UserMap } from 'core/nostr/type';
import {Event} from 'core/nostr/Event';
import { CallWorker } from 'core/worker/caller';
import { EventWithSeen } from 'pages/type';

import styles from './index.module.scss';
import PostUser from './PostUser';
import PostReactions from './PostReactions';
import PostArticle from './PostArticle';
import { PostContent } from './PostContent';
import { Nip18 } from 'core/nip/18';
import PostRepost from './PostRepost';
import { toUnSeenEvent } from 'core/nostr/util';
import PostArticleComment from './PostArticleComment';
import { Paths } from 'constants/path';
import { PostCommunityHeader } from './PostCommunityHeader';
import { message } from 'antd';

interface PostItemsProps {
  msgList: EventWithSeen[];
  worker: CallWorker;
  userMap: UserMap;
  eventMap: EventMap;
  relays: string[];
  showLastReplyToEvent?: boolean;
  showFromCommunity?: boolean;
  extraMenu?: {
    label: string;
    onClick: (event: Event, msg: typeof message) => any;
  }[];
}

const PostItems: React.FC<PostItemsProps> = ({
  msgList,
  worker,
  userMap,
  eventMap,
  relays,
  showLastReplyToEvent = true,
  showFromCommunity = true,
  extraMenu
}) => {
  const getUser = (msg: EventWithSeen) => userMap.get(msg.pubkey);

  return (
    <>
      {msgList.map(msg =>
        Nip18.isRepostEvent(msg) ? (
          <PostRepost
            event={msg}
            userMap={userMap}
            worker={worker}
            eventMap={eventMap}
            showLastReplyToEvent={showLastReplyToEvent}
            key={msg.id}
          />
        ) : (
          <div className={styles.post} key={msg.id}>
            {showFromCommunity && <PostCommunityHeader event={msg} />}
            <PostUser
              publicKey={msg.pubkey}
              avatar={getUser(msg)?.picture || ''}
              name={getUser(msg)?.name}
              time={msg.created_at}
              event={msg}
              extraMenu={extraMenu}
            />
            <div className={styles.content}>
              {Nip23.isBlogPost(msg) ? (
                <PostArticle
                  userAvatar={getUser(msg)?.picture || ''}
                  userName={getUser(msg)?.name || ''}
                  event={msg}
                  key={msg.id}
                />
              ) : Nip23.isBlogCommentMsg(msg) ? (
                <PostArticleComment
                  userMap={userMap}
                  eventMap={eventMap}
                  event={msg}
                  worker={worker}
                  key={msg.id}
                  showReplyArticle={showLastReplyToEvent}
                />
              ) : Nip9802.isBlogHighlightMsg(msg) ? (
                <>HighlightMsg</>
              ) : (
                <PostContent
                  ownerEvent={msg}
                  userMap={userMap}
                  worker={worker}
                  eventMap={eventMap}
                  showLastReplyToEvent={showLastReplyToEvent}
                />
              )}
              <PostReactions
                ownerEvent={toUnSeenEvent(msg)}
                worker={worker}
                seen={msg.seen!}
                userMap={userMap}
              />
            </div>
          </div>
        ),
      )}
    </>
  );
};

export default PostItems;
