import { Paths } from 'constants/path';
import { useRouter } from 'next/router';
import { RootState } from 'store/configureStore';
import { useDispatch, useSelector } from 'react-redux';
import { useMatchPad } from 'hooks/useMediaQuery';
import { MenuItemType } from 'antd/es/menu/hooks/useItems';
import { useTranslation } from 'react-i18next';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { EventSetMetadataContent } from 'core/nostr/type';
import { Badge, Button, Dropdown } from 'antd';
import { Dispatch, SetStateAction } from 'react';
import { MenuId, NavMenus, UserMenus, navClick, getNavLink } from './utils';
import * as Avatar from '@radix-ui/react-avatar';

import Link from 'next/link';
import Icon from 'components/Icon';
import styles from './index.module.scss';
import dynamic from 'next/dynamic';
import { useNotification } from 'hooks/useNotification';
import { shortifyPublicKey } from 'core/nostr/content';

const PcPadNav = ({
  user,
  setOpenWrite,
}: {
  user?: EventSetMetadataContent;
  setOpenWrite: Dispatch<SetStateAction<boolean>>;
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isPad = useMatchPad();
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
      icon: item?.icon,
      key: item?.id,
      label: t(item?.title),
      onClick: () =>
        item.id === MenuId.signOut
          ? doLogout()
          : navClick(item, myPublicKey, router, isLoggedIn, t),
    });
    return result;
  }, [] as MenuItemType[]);

  return (
    <nav className="hidden md:block col-span-1 lg:col-span-3 border-0 border-r border-solid border-neutral-200">
      <div className="sticky top-0">
        <div className="py-4 px-5">
          <Link href={Paths.home} className="inline-block">
            <img
              className="w-10 h-10 object-contain align-middle"
              src="/logo512.png"
              alt="logo"
            />
          </Link>
        </div>
        <ul className="list-none p-0 m-0 mt-7">
          <li className="px-5 hover:bg-conditional-hover01">
            <div
              className="flex items-center w-full h-16 cursor-pointer gap-3"
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
              <h1>
                {isLoggedIn
                  ? user?.name || shortifyPublicKey(myPublicKey)
                  : t('nav.menu.signIn')}
              </h1>
            </div>
          </li>
          {NavMenus.map((item, key) => (
            <li key={key}>
              <Link
                href={getNavLink(item, myPublicKey)}
                className={router.pathname === item.link ? styles.active : ''}
              >
                {item.icon}
                {item.id === MenuId.notifications && isNewUnread ? (
                  <Badge dot>
                    <span>{t(item.title)}</span>
                  </Badge>
                ) : (
                  <span>{t(item.title)}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <Button
          block={isPad ? false : true}
          type="primary"
          shape={isPad ? 'circle' : 'default'}
          icon={isPad ? <Icon type="icon-Pencil" /> : null}
          onClick={() => setOpenWrite(true)}
          disabled={!isLoggedIn}
        >
          {!isPad && t('nav.menu.blogDashboard')}
        </Button>
      </div>
    </nav>
  );
};

export default dynamic(() => Promise.resolve(PcPadNav), {
  ssr: false,
});
