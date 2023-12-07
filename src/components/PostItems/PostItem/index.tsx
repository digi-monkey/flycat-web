import { Nip23 } from 'core/nip/23';
import { Nip9802 } from 'core/nip/9802';
import { Event } from 'core/nostr/Event';
import { CallWorker } from 'core/worker/caller';
import { toUnSeenEvent } from 'core/nostr/util';
import { PostCommunityHeader } from '../PostCommunityHeader';
import { message } from 'antd';
import { DbEvent } from 'core/db/schema';
import { EventSetMetadataContent } from 'core/nostr/type';
import { Nip18 } from 'core/nip/18';

import styles from '../index.module.scss';
import dynamic from 'next/dynamic';

const PostUser = dynamic(
  async () => {
    return await import('../PostUser');
  },
  {
    loading: () => <p>Loading PostUser...</p>,
    ssr: false,
    suspense: true,
  },
);

const PostRepost = dynamic(
  async () => {
    return await import('../PostRepost');
  },
  {
    loading: () => <p>Loading PostRepost...</p>,
    ssr: false,
    suspense: true,
  },
);

const PostArticleComment = dynamic(
  async () => {
    return await import('../PostArticleComment');
  },
  {
    loading: () => <p>Loading PostArticleComment...</p>,
    ssr: false,
    suspense: true,
  },
);

const PostArticle = dynamic(
  async () => {
    return await import('../PostArticle');
  },
  {
    loading: () => <p>Loading PostArticle...</p>,
    ssr: false,
    suspense: true,
  },
);

const PostReactions = dynamic(
  async () => {
    return await import('../PostReactions/index');
  },
  {
    loading: () => <p>Loading PostReactions...</p>,
    ssr: false,
    suspense: true,
  },
);

const PostContent = dynamic(
  async () => {
    const { PostContent } = await import('../PostContent/index');
    return PostContent;
  },
  {
    loading: () => <p>Loading PostContent...</p>,
    ssr: false,
    suspense: true,
  },
);

interface PostItemProps {
  profile: EventSetMetadataContent | null;
  event: DbEvent;
  worker: CallWorker;
  showLastReplyToEvent?: boolean;
  showFromCommunity?: boolean;
  extraMenu?: {
    label: string;
    onClick: (event: Event, msg: typeof message) => any;
  }[];
  extraHeader?: React.ReactNode;
}

export const PostItem: React.FC<PostItemProps> = ({
  profile,
  event,
  worker,
  showLastReplyToEvent = true,
  showFromCommunity = true,
  extraMenu,
  extraHeader,
}) => {
  const PostUI: React.FC<{ content: JSX.Element }> = ({ content }) => (
    <div className={styles.post} key={event.id}>
      {extraHeader}
      {showFromCommunity && <PostCommunityHeader event={event} />}
      <PostUser
        publicKey={event.pubkey}
        profile={profile}
        event={event}
        extraMenu={extraMenu}
      />
      <div className={styles.content}>
        {content}
        <PostReactions
          ownerEvent={toUnSeenEvent(event)}
          worker={worker}
          seen={event.seen!}
        />
      </div>
    </div>
  );

  const Post: React.FC = () => {
    if (Nip18.isRepostEvent(event)) {
      return (
        <PostRepost
          event={event}
          worker={worker}
          showLastReplyToEvent={showLastReplyToEvent}
          key={event.id}
        />
      );
    }

    if (Nip23.isBlogPost(event)) {
      return <PostUI content={<PostArticle event={event} key={event.id} />} />;
    }

    if (Nip23.isBlogCommentMsg(event)) {
      return (
        <PostUI
          content={
            <PostArticleComment
              event={event}
              worker={worker}
              key={event.id}
              showReplyArticle={showLastReplyToEvent}
            />
          }
        />
      );
    }

    if (Nip9802.isBlogHighlightMsg(event)) {
      return <PostUI content={<>HighlightMsg</>} />;
    }

    return (
      <PostUI
        content={
          <PostContent
            ownerEvent={event}
            worker={worker}
            showLastReplyToEvent={showLastReplyToEvent}
          />
        }
      />
    );
  };

  return <Post />;
};
