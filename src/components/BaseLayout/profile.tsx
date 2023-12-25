import * as Avatar from '@radix-ui/react-avatar';
import { shortifyPublicKey } from 'core/nostr/content';
import { useRouter } from 'next/router';
import Icon from 'components/Icon';
import { EventSetMetadataContent } from 'core/nostr/type';
import { useTranslation } from 'react-i18next';
import { Paths } from 'constants/path';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { cn } from 'utils/classnames';

type ProfileProps = {
  user?: EventSetMetadataContent;
  showName?: boolean;
  className?: string;
};

export function Profile(props: ProfileProps) {
  const { t } = useTranslation();
  const { user, showName, className } = props;
  const myPublicKey = useReadonlyMyPublicKey();
  const router = useRouter();
  const isLoggedIn = !!myPublicKey;

  return (
    <div
      className={cn(
        'flex justify-center xl:justify-normal items-center w-full h-14 gap-4',
        className,
      )}
      onClick={() => !isLoggedIn && router.push({ pathname: Paths.login })}
    >
      <Avatar.Root className="w-8 h-8 rounded-full bg-gray-400">
        {user && <Avatar.Image src={user.picture} />}
        <Avatar.Fallback className="w-full h-full flex justify-center items-center">
          <Icon type="icon-user" className="w-6 h-6 fill-gray-700" />
        </Avatar.Fallback>
      </Avatar.Root>
      <h1
        className={cn('my-0 text-xl', {
          'hidden xl:block': !showName,
        })}
      >
        {isLoggedIn
          ? user?.name || shortifyPublicKey(myPublicKey)
          : t('nav.menu.signIn')}
      </h1>
    </div>
  );
}
