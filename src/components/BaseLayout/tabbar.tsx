import Icon from 'components/Icon';
import { Paths } from 'constants/path';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { cn } from 'utils/classnames';
import AddNoteDialog from './add-note';
import { NavMenus, MenuId, navClick, MenuItem } from './utils';

export type TabbarProps = {
  onClickPost(): void;
};

export function Tabbar(props: TabbarProps) {
  const { onClickPost } = props;
  const { t } = useTranslation();
  const router = useRouter();
  const myPublicKey = useMyPublicKey();
  const isLoggedIn = useSelector(
    (state: RootState) => state.loginReducer.isLoggedIn,
  );

  const navs = useMemo(() => {
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

  const renderItem = useCallback(
    (item: MenuItem) => {
      return (
        <li
          key={item.id}
          className="flex justify-center flex-1 pt-2 cursor-pointer"
          onClick={() =>
            item.id !== MenuId.add &&
            navClick(item, myPublicKey, router, isLoggedIn, t)
          }
        >
          <div
            className={cn(
              'flex justify-center items-center w-9 h-7 rounded-lg',
              {
                'bg-text-link': item.id === MenuId.add,
              },
            )}
          >
            <Icon
              type={item.icon}
              className={cn('w-6 h-6 fill-text-secondary', {
                'fill-text-primary': item.link === router.pathname,
                'fill-white': item.id === MenuId.add,
              })}
            />
          </div>
        </li>
      );
    },
    [myPublicKey, router, isLoggedIn, t],
  );

  return (
    <div className="fixed bottom-0 h-[60px] w-screen bg-white bg-opacity-80 backdrop-blur z-50">
      <ul className="flex list-none p-0 m-0">
        {navs.map(item => (
          <>
            {item.id === MenuId.add ? (
              <AddNoteDialog>{renderItem(item)}</AddNoteDialog>
            ) : (
              renderItem(item)
            )}
          </>
        ))}
      </ul>
    </div>
  );
}
