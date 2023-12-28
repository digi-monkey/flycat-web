import * as Avatar from '@radix-ui/react-avatar';
import { shortifyPublicKey } from 'core/nostr/content';
import Icon from 'components/Icon';
import { EventSetMetadataContent } from 'core/nostr/type';
import { useTranslation } from 'react-i18next';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { cn } from 'utils/classnames';
import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { Paths } from 'constants/path';

type ProfileProps = {
  user?: EventSetMetadataContent;
  showName?: boolean;
  className?: string;
};

export function Profile(props: ProfileProps) {
  const { t } = useTranslation();
  const { user, showName, className } = props;
  const myPublicKey = useReadonlyMyPublicKey();
  const isLoggedIn = !!myPublicKey;
  const router = useRouter();

  const onClick = useCallback(() => {
    if (!isLoggedIn) {
      router.push(Paths.login);
      return;
    }
    router.push(Paths.user + myPublicKey);
  }, [isLoggedIn, router, myPublicKey]);

  return (
    <div
      className={cn(
        'flex justify-center xl:justify-normal items-center w-full h-14 gap-4 cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      <Avatar.Root className="w-8 h-8 rounded-full bg-gray-400 overflow-hidden">
        {user && <Avatar.Image src={user.picture} className="w-8 h-8" />}
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
