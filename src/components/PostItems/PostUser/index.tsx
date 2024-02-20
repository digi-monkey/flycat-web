import { Paths } from 'constants/path';
import { useTimeSince } from 'hooks/useTimeSince';
import { EventWithSeen } from 'pages/type';
import { Event } from 'core/nostr/Event';
import { useEffect, useState } from 'react';
import { isNip05DomainName } from 'core/nip/05';
import { PostUserMenu } from './menu';
import { EventSetMetadataContent } from 'core/nostr/type';
import Link from 'next/link';
import AvatarProfile from 'components/shared/ui/Avatar';

interface PostUserProps {
  publicKey: string;
  profile: EventSetMetadataContent | null | undefined;
  event: EventWithSeen;
  extraMenu?: {
    label: string;
    onClick: (event: Event) => any;
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

  const name =
    profile?.display_name ||
    profile?.name ||
    `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`;

  return (
    <div className="flex justify-between">
      <div className="flex gap-3">
        <Link href={userUrl} className="no-underline">
          <AvatarProfile
            src={profile?.picture}
            alt={name}
            fallback={name.slice(0, 2)}
          />
        </Link>
        <div className="flex flex-col gap-0.5">
          <Link
            className="text-neutral-900 subheader2 no-underline"
            href={userUrl}
          >
            {name}
          </Link>
          <time className="text-neutral-600 footnote">{timeSince}</time>
        </div>
      </div>
      <PostUserMenu publicKey={publicKey} event={event} extraMenu={extraMenu} />
    </div>
  );
};

export default PostUser;
