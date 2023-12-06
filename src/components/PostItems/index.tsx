import { Nip23 } from 'core/nip/23';
import { Nip9802 } from 'core/nip/9802';
import { Event } from 'core/nostr/Event';
import { CallWorker } from 'core/worker/caller';
import { EventWithSeen } from 'pages/type';
import { Nip18 } from 'core/nip/18';
import { toUnSeenEvent } from 'core/nostr/util';
import { PostCommunityHeader } from './PostCommunityHeader';
import { message } from 'antd';

import styles from './index.module.scss';
import PostUser from './PostUser';
import PostReactions from './PostReactions';
import PostArticle from './PostArticle';
import PostRepost from './PostRepost';
import PostArticleComment from './PostArticleComment';
import dynamic from 'next/dynamic';

const PostContent = dynamic(
  async () => {
    const {PostContent} = await import("./PostContent/index");
    return PostContent;
  },
  {loading: () => <p>Loading caused by client page transition ...</p>,  ssr: false, suspense: true  }
)

interface PostItemsProps {
  msgList: EventWithSeen[];
  worker: CallWorker;
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
  relays,
  showLastReplyToEvent = true,
  showFromCommunity = true,
  extraMenu,
  extraHeader
}) => {

  return (
    <>
      {msgList.map(msg => {

        return Nip18.isRepostEvent(msg) ? (
          <PostRepost
            event={msg}
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
              event={msg}
              extraMenu={extraMenu}
            />
            <div className={styles.content}>
              {Nip23.isBlogPost(msg) ? (
                <PostArticle
                  event={msg}
                  key={msg.id}
                />
              ) : Nip23.isBlogCommentMsg(msg) ? (
                <PostArticleComment
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
                  worker={worker}
                  showLastReplyToEvent={showLastReplyToEvent}
                />
              )}
              <PostReactions
                ownerEvent={toUnSeenEvent(msg)}
                worker={worker}
                seen={msg.seen!}
              />
            </div>
          </div>
        )
      }
      )}
    </>
  );
};

export default PostItems;
