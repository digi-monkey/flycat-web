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
import { useLiveQuery } from 'dexie-react-hooks';
import { dexieDb } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { deserializeMetadata } from 'core/nostr/content';

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

  const profileEvents = useLiveQuery(async () => {
    const events = await dexieDb.profileEvent.bulkGet(msgList.map(m => m.pubkey));
    return events.filter(e => e!=null) as DbEvent[];
  }, [msgList], [] as DbEvent[]);

  const getUser = (pubkey: string) => {
    const user = profileEvents.find(e => e.pubkey === pubkey);
    if(user){
      return deserializeMetadata(user.content);
    }
    return null;
  }

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
              profile={getUser(msg.pubkey)}
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
