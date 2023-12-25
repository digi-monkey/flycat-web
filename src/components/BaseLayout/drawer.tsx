import Icon from 'components/Icon';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
} from 'components/shared/ui/Drawer';
import { Paths } from 'constants/path';
import { EventSetMetadataContent } from 'core/nostr/type';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiX } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { Profile } from './profile';
import { NavMenus, MenuId, navClick } from './utils';

export type UserDrawerProps = {
  user?: EventSetMetadataContent;
  onClickPost(): void;
};

export function UserDrawer(props: UserDrawerProps) {
  const { user, onClickPost } = props;
  const router = useRouter();
  const { t } = useTranslation();
  const isLoggedIn = useSelector(
    (state: RootState) => state.loginReducer.isLoggedIn,
  );
  const dispatch = useDispatch();
  const doLogout = () => {
    dispatch({
      type: 'LOGOUT',
    });
    router.push(Paths.login);
  };
  const myPublicKey = useMyPublicKey();
  const [opened, setOpened] = useState(false);

  const menu = useMemo(() => {
    const result = NavMenus.filter(item =>
      [
        MenuId.home,
        MenuId.communities,
        MenuId.relays,
        MenuId.notifications,
      ].includes(item.id),
    );
    result.splice(2, 0, {
      id: MenuId.add,
      icon: 'icon-plus',
      title: 'nav.menu.blogDashboard',
      link: Paths.write,
    });
    return result;
  }, []);

  return (
    <Drawer open={opened} onOpenChange={setOpened}>
      <DrawerTrigger asChild>
        <div className="sm:hidden flex items-center">
          <FiMenu className="w-7 h-7 fill-gray-700" />
        </div>
      </DrawerTrigger>
      <DrawerContent className="h-screen bg-surface-02 rounded-none">
        <div className="mx-auto w-full p-4 box-border">
          <div className="mb-2 px-2">
            <div className="flex justify-end items-center">
              <DrawerClose asChild>
                <FiX className="w-7 h-7 fill-gray-700" />
              </DrawerClose>
            </div>
            <Profile user={user} className="justify-start" showName />
          </div>
          <div className="border-0 border-b border-solid border-border-01 pb-2 mb-2">
            {menu.map(item => (
              <div
                key={item.id}
                className="flex items-center px-2 py-3 gap-3 hover:bg-conditional-hover01 rounded-full cursor-pointer"
                onClick={() => {
                  setOpened(false);
                  if (item.id === MenuId.add) {
                    onClickPost();
                  }
                  navClick(item, myPublicKey, router, isLoggedIn, t);
                }}
              >
                <Icon type={item.icon} className="w-6 h-6 fill-text-primary" />
                <span className="label text-text-primary">{t(item.title)}</span>
              </div>
            ))}
          </div>
          <div
            className="flex items-center px-2 py-3 gap-3 hover:bg-conditional-hover01 rounded-full cursor-pointer"
            onClick={() => {
              setOpened(false);
              doLogout();
            }}
          >
            <Icon type="icon-Move-out" className="w-6 h-6 fill-text-primary" />
            <span className="label text-text-primary">
              {t('nav.menu.signOut')}
            </span>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
