import Icon from 'components/Icon';
import { Nip172 } from 'core/nip/172';
import { Event } from 'core/nostr/Event';
import styles from '../index.module.scss';
import Link from 'next/link';
import { Paths } from 'constants/path';

export function PostCommunityHeader({ event }: { event: Event }) {
  if (!Nip172.isCommunityPost(event)) {
    return null;
  }

  return (
    <div className={styles.communityPostTitle}>
      <Icon type="icon-explore" />
      From
      <Link
        href={`${
          Paths.communities +
          '/n/' +
          encodeURIComponent(Nip172.getCommunityAddr(event))
        }`}
      >
        {Nip172.parseCommunityAddr(Nip172.getCommunityAddr(event)).identifier}
      </Link>
    </div>
  );
}
