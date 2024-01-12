import Icon from 'components/Icon';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
} from 'components/shared/ui/Drawer';
import { EventSetMetadataContent } from 'core/nostr/type';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBars, FaX } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { useWindowSize } from 'usehooks-ts';
import { NavLink } from './nav-link';
import { Profile } from './profile';
import { MenuItem, UserMenus } from './utils';

export type UserDrawerProps = {
  user?: EventSetMetadataContent;
};

export function UserDrawer(props: UserDrawerProps) {
  const { user } = props;
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const { height } = useWindowSize();
  const isLoggedIn = useSelector(
    (state: RootState) => state.loginReducer.isLoggedIn,
  );

  const userMenus = UserMenus.reduce((result, item) => {
    if (!isLoggedIn && item.needLogin) {
      return result;
    }
    result.push(item);
    return result;
  }, [] as MenuItem[]);

  return (
    <Drawer open={opened} onOpenChange={setOpened}>
      <DrawerTrigger asChild>
        <div className="sm:hidden flex items-center">
          <FaBars className="w-7 h-7 fill-gray-700" />
        </div>
      </DrawerTrigger>
      <DrawerContent
        className="h-screen bg-surface-02 rounded-none"
        style={{ height }}
      >
        <div className="mx-auto w-full p-4 box-border">
          <div className="mb-2 px-2">
            <div className="flex justify-end items-center">
              <DrawerClose asChild>
                <FaX className="w-7 h-7 fill-gray-700" />
              </DrawerClose>
            </div>
            <Profile user={user} className="justify-start" showName />
          </div>
          <ul className="list-none p-0 y-0">
            {userMenus.map(item => (
              <NavLink
                key={item.id}
                as="li"
                item={item}
                className="flex items-center px-2 py-3 gap-3 hover:bg-conditional-hover01 rounded-full cursor-pointer"
                onClick={() => {
                  setOpened(false);
                  return true;
                }}
              >
                <Icon type={item.icon} className="w-6 h-6 fill-text-primary" />
                <span className="label text-text-primary">{t(item.title)}</span>
              </NavLink>
            ))}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
