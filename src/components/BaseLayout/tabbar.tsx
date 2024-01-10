import Icon from 'components/Icon';
import { Paths } from 'constants/path';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { cn } from 'utils/classnames';
import AddNoteDialog from './add-note';
import { NavLink } from './nav-link';
import { NavMenus, MenuId, MenuItem } from './utils';

export function Tabbar() {
  const router = useRouter();

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
        <NavLink
          key={item.id}
          as="li"
          item={item}
          className="flex justify-center flex-1 py-2 cursor-pointer"
          onClick={() => item.id !== MenuId.add}
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
        </NavLink>
      );
    },
    [router],
  );

  return (
    <div className="fixed bottom-0 h-[56px] w-screen bg-white bg-opacity-80 backdrop-blur z-50">
      <ul className="flex list-none p-0 m-0">
        {navs.map(item => (
          <div key={item.id}>
            {item.id === MenuId.add ? (
              <AddNoteDialog>{renderItem(item)}</AddNoteDialog>
            ) : (
              renderItem(item)
            )}
          </div>
        ))}
      </ul>
    </div>
  );
}
