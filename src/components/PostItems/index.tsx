import { Nip23 } from 'core/nip/23';
import { Nip9802 } from 'core/nip/9802';
import { EventMap, UserMap } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { CallWorker } from 'core/worker/caller';
import { EventWithSeen } from 'pages/type';
import { PostContent } from './PostContent';
import { Nip18 } from 'core/nip/18';
import { toUnSeenEvent } from 'core/nostr/util';
import { PostCommunityHeader } from './PostCommunityHeader';
import {
  message,
} from 'antd';

import styles from './index.module.scss';
import PostUser from './PostUser';
import PostReactions from './PostReactions';
import PostArticle from './PostArticle';
import PostRepost from './PostRepost';
import PostArticleComment from './PostArticleComment';

interface PostItemsProps {
  msgList: EventWithSeen[];
  worker: CallWorker;
  userMap: UserMap;
  relays: string[];
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
  userMap,
  relays,
  showLastReplyToEvent = true,
  showFromCommunity = true,
  extraMenu,
  extraHeader
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
            showLastReplyToEvent={showLastReplyToEvent}
            key={msg.id}
          />
        ) : (
          <div className={styles.post} key={msg.id}>
            {extraHeader}
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
