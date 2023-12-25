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
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiX } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { Profile } from './profile';
import { MenuId, navClick, UserMenus } from './utils';

export type UserDrawerProps = {
  user?: EventSetMetadataContent;
};

export function UserDrawer(props: UserDrawerProps) {
  const { user } = props;
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
          <ul className="list-none p-0 y-0">
            {UserMenus.map(item => (
              <li
                key={item.id}
                className="flex items-center px-2 py-3 gap-3 hover:bg-conditional-hover01 rounded-full cursor-pointer"
                onClick={() => {
                  setOpened(false);
                  if (item.id === MenuId.signOut) {
                    doLogout();
                    return;
                  }
                  navClick(item, myPublicKey, router, isLoggedIn, t);
                }}
              >
                <Icon type={item.icon} className="w-6 h-6 fill-text-primary" />
                <span className="label text-text-primary">{t(item.title)}</span>
              </li>
            ))}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
