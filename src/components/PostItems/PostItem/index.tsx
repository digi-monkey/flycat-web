import { Nip23 } from 'core/nip/23';
import { Nip9802 } from 'core/nip/9802';
import { Event } from 'core/nostr/Event';
import { CallWorker } from 'core/worker/caller';
import { DbEvent } from 'core/db/schema';
import { EventSetMetadataContent } from 'core/nostr/type';
import { Nip18 } from 'core/nip/18';
import { PostUI } from './ui';
import { useMemo } from 'react';

import dynamic from 'next/dynamic';

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

const PostHighLight = dynamic(
  async () => {
    return await import('../PostHighLight');
  },
  {
    loading: () => <p>Loading PostHighLight...</p>,
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

const PostContent = dynamic(
  async () => {
    const { PostContent } = await import('../PostContent');
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
    onClick: (event: Event) => any;
  }[];
  extraHeader?: React.ReactNode;
  truncate?: boolean;
}

export const PostItem: React.FC<PostItemProps> = ({
  profile,
  event,
  worker,
  showLastReplyToEvent = true,
  showFromCommunity = true,
  extraMenu,
  extraHeader,
  truncate = true,
}) => {
  const render = useMemo(() => {
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
      return (
        <PostUI
          content={<PostArticle event={event} key={event.id} />}
          profile={profile}
          event={event}
          worker={worker}
          showFromCommunity={showFromCommunity}
          extraMenu={extraMenu}
          extraHeader={extraHeader}
        />
      );
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
          profile={profile}
          event={event}
          worker={worker}
          showFromCommunity={showFromCommunity}
          extraMenu={extraMenu}
          extraHeader={extraHeader}
        />
      );
    }

    if (Nip9802.isHighlightMsg(event)) {
      return (
        <PostHighLight
          event={event}
          worker={worker}
          showFromCommunity={showFromCommunity}
          extraMenu={extraMenu}
          extraHeader={extraHeader}
        />
      );
    }

    return (
      <PostUI
        content={
          <PostContent
            ownerEvent={event}
            worker={worker}
            showLastReplyToEvent={showLastReplyToEvent}
            truncate={truncate}
          />
        }
        profile={profile}
        event={event}
        worker={worker}
        showFromCommunity={showFromCommunity}
        extraMenu={extraMenu}
        extraHeader={extraHeader}
      />
    );
  }, [
    event,
    profile,
    worker,
    showLastReplyToEvent,
    showFromCommunity,
    extraMenu,
    extraHeader,
    truncate,
  ]);

  return render;
};
