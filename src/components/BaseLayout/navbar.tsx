import { Paths } from 'constants/path';
import { useRouter } from 'next/router';
import { RootState } from 'store/configureStore';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { EventSetMetadataContent } from 'core/nostr/type';
import { MenuId, NavMenus, UserMenus, navClick, getNavLink } from './utils';
import * as Avatar from '@radix-ui/react-avatar';
import Link from 'next/link';
import Icon from 'components/Icon';
import dynamic from 'next/dynamic';
import { useNotification } from 'hooks/useNotification';
import { shortifyPublicKey } from 'core/nostr/content';
import { cn } from 'utils/classnames';
import { Badge } from 'components/shared/Badge';
import { DropdownMenu } from 'components/shared/DropdownMenu';
import { DropdownMenuItem } from 'components/shared/DropdownMenu/type';

const Navbar = ({
  user,
  onClickPost,
}: {
  user?: EventSetMetadataContent;
  onClickPost(): void;
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const myPublicKey = useReadonlyMyPublicKey();
  const isLoggedIn = useSelector(
    (state: RootState) => state.loginReducer.isLoggedIn,
  );
  const isNewUnread = useNotification();
  const doLogout = () => {
    dispatch({
      type: 'LOGOUT',
    });
    router.push(Paths.login);
  };

  const userMenus = UserMenus.reduce((result, item) => {
    if (!item || item.id === MenuId.bookmarks) return result;

    result.push({
      type: 'item',
      icon: item?.icon,
      value: item?.id,
      label: t(item?.title),
      id: item?.id,
      link: item?.link,
    });
    return result;
  }, [] as DropdownMenuItem[]);

  return (
    <nav>
      <div className="flex justify-center xl:justify-normal py-4 px-5">
        <Link href={Paths.home} className="inline-block">
          <img
            className="w-10 h-10 object-contain align-middle"
            src="/logo512.png"
            alt="logo"
          />
        </Link>
      </div>
      <ul className="list-none p-0 m-0 mt-6">
        <li className="lg:px-5 rounded-full hover:bg-conditional-hover01 cursor-pointer">
          <DropdownMenu
            items={userMenus}
            onSelect={item => {
              if (item.id === MenuId.signOut) {
                doLogout();
                return;
              }
              navClick(item, myPublicKey, router, isLoggedIn, t);
            }}
          >
            <div
              className="flex justify-center xl:justify-normal items-center w-full h-14 gap-4"
              onClick={() =>
                !isLoggedIn && router.push({ pathname: Paths.login })
              }
            >
              <Avatar.Root className="w-8 h-8 rounded-full bg-gray-400">
                {user && <Avatar.Image src={user.picture} />}
                <Avatar.Fallback className="w-full h-full flex justify-center items-center">
                  <Icon type="icon-user" className="w-6 h-6 fill-gray-700" />
                </Avatar.Fallback>
              </Avatar.Root>
              <h1 className="hidden xl:block my-0">
                {isLoggedIn
                  ? user?.name || shortifyPublicKey(myPublicKey)
                  : t('nav.menu.signIn')}
              </h1>
            </div>
          </DropdownMenu>
        </li>
        {NavMenus.map((item, key) => (
          <li
            key={key}
            className="flex justify-center xl:justify-normal hover:bg-conditional-hover01 rounded-full cursor-pointer"
          >
            <Link
              href={getNavLink(item, myPublicKey)}
              className={cn(
                'flex px-5 w-full h-[56px] items-center no-underline text-neutral-600',
                {
                  'text-neutral-900 subheader1-bold':
                    router.pathname === item.link,
                },
              )}
            >
              <Badge
                className="flex items-center gap-3 subheader1"
                dot={item.id === MenuId.notifications && isNewUnread}
              >
                <Icon
                  type={item.icon}
                  className={cn('w-6 h-6 fill-neutral-600', {
                    'fill-neutral-900': router.pathname === item.link,
                  })}
                />
                <div className="hidden xl:block">{t(item.title)}</div>
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex justify-center xl:justify-normal">
        <button
          className={cn(
            'h-11 w-11 xl:w-full px-0 xl:px-5 mt-6 bg-primary-600 hover:bg-primary-500 transition-colors rounded-full cursor-pointer border-none',
            {
              'bg-gray-500 hover:bg-gray-500 cursor-not-allowed': !isLoggedIn,
            },
          )}
          onClick={onClickPost}
        >
          <div className="flex justify-center items-center w-full gap-2">
            <Icon type="icon-Pencil" className="w-5 h-5 fill-white" />
            <span className="hidden xl:block text-white">
              {t('nav.menu.blogDashboard')}
            </span>
          </div>
        </button>
      </div>
    </nav>
  );
};

export default dynamic(() => Promise.resolve(Navbar), {
  ssr: false,
});
