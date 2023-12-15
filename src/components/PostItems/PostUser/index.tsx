import { Avatar, message } from 'antd';
import { Paths } from 'constants/path';
import { useTimeSince } from 'hooks/useTimeSince';
import { EventWithSeen } from 'pages/type';
import { Event } from 'core/nostr/Event';
import { useEffect, useState } from 'react';
import { isNip05DomainName } from 'core/nip/05';
import { PostUserMenu } from './menu';
import { EventSetMetadataContent } from 'core/nostr/type';

import styles from './index.module.scss';
import Link from 'next/link';

interface PostUserProps {
  publicKey: string;
  profile: EventSetMetadataContent | null | undefined;
  event: EventWithSeen;
  extraMenu?: {
    label: string;
    onClick: (event: Event, msg: typeof message) => any;
  }[];
}

const PostUser: React.FC<PostUserProps> = ({
  publicKey,
  profile,
  event,
  extraMenu,
}) => {
  const timeSince = useTimeSince(event.created_at || 0);
  const [userUrl, setUserUrl] = useState<string>(`${Paths.user + publicKey}`);

  useEffect(() => {
    if (profile?.nip05 && isNip05DomainName(profile.nip05)) {
      // todo: find a better way to validate and cache the result for nip05 before use it
      setUserUrl(`${Paths.user + profile.nip05}`);
    }
  }, [profile]);

  return (
    <div className={styles.postUser}>
      <div className={styles.user}>
        <Link href={userUrl}>
          <Avatar src={profile?.picture} alt="picture" />
        </Link>
        <div className={styles.info}>
          <Link href={userUrl}>{profile?.name || '...'}</Link>
          <p>
            <time>{timeSince}</time>
          </p>
        </div>
      </div>
      <PostUserMenu publicKey={publicKey} event={event} extraMenu={extraMenu} />
    </div>
  );
};

export default PostUser;
