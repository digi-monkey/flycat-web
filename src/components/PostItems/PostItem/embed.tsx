import { Event } from 'core/nostr/Event';
import { PostCommunityHeader } from '../PostCommunityHeader';
import { DbEvent } from 'core/db/schema';
import { EventSetMetadataContent } from 'core/nostr/type';

import styles from '../index.module.scss';
import dynamic from 'next/dynamic';
import classNames from 'classnames';

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

export interface EmbedPostUIProp {
  content: JSX.Element;
  profile: EventSetMetadataContent | null;
  event: DbEvent;
  showFromCommunity?: boolean;
  extraMenu?: {
    label: string;
    onClick: (event: Event) => any;
  }[];
  extraHeader?: React.ReactNode;
}

export const EmbedPostUI: React.FC<EmbedPostUIProp> = ({
  content,
  profile,
  event,
  extraMenu,
  extraHeader,
  showFromCommunity,
}) => (
  <div className={classNames([styles.post, styles.embed])} key={event.id}>
    {extraHeader}
    {showFromCommunity && <PostCommunityHeader event={event} />}
    <PostUser
      publicKey={event.pubkey}
      profile={profile}
      event={event}
      extraMenu={extraMenu}
    />
    <div className={styles.content}>{content}</div>
  </div>
);
