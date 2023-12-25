import { Paths } from 'constants/path';
import { useRouter } from 'next/router';
import { RootState } from 'store/configureStore';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { EventSetMetadataContent } from 'core/nostr/type';
import { MenuId, NavMenus, UserMenus, navClick, getNavLink } from './utils';
import Link from 'next/link';
import Icon from 'components/Icon';
import dynamic from 'next/dynamic';
import { useNotification } from 'hooks/useNotification';
import { cn } from 'utils/classnames';
import { Profile } from './profile';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuTrigger,
} from 'components/shared/ui/DropdownMenu';
import { Badge, BadgeDot } from 'components/shared/ui/Badge';
import AddNoteDialog from './add-note';

type MenuItem = {
  icon: string;
  value: string;
  label: string;
  id: string;
  link: string;
};

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
      icon: item?.icon,
      value: item?.id,
      label: t(item?.title),
      id: item?.id,
      link: item?.link,
    });
    return result;
  }, [] as MenuItem[]);

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
      <ul className="flex flex-col items-center xl:items-start list-none p-0 m-0 mt-6">
        <li className="w-[56px] xl:w-full xl:px-5 rounded-full hover:bg-conditional-hover01 cursor-pointer box-border">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Profile
                user={user}
                onClick={() =>
                  !isLoggedIn && router.push({ pathname: Paths.login })
                }
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {userMenus.map(item => (
                <DropdownMenuItem
                  key={item.id}
                  onSelect={() => {
                    if (item.id === MenuId.signOut) {
                      doLogout();
                      return;
                    }
                    navClick(item, myPublicKey, router, isLoggedIn, t);
                  }}
                >
                  <Icon
                    type={item.icon}
                    className="w-[18px] h-[18px] fill-text-primary"
                  />
                  <span className="label">{item.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
        {NavMenus.map((item, key) => (
          <li
            key={key}
            className="w-[56px] xl:w-full xl:px-5 hover:bg-conditional-hover01 rounded-full cursor-pointer box-border"
          >
            <Link
              href={getNavLink(item, myPublicKey)}
              className={cn(
                'flex justify-center xl:justify-normal w-full h-[56px] items-center no-underline text-neutral-600',
                {
                  'text-neutral-900 subheader1-bold':
                    router.pathname === item.link,
                },
              )}
            >
              <Badge className="flex items-center gap-3 subheader1">
                <Icon
                  type={item.icon}
                  className={cn('w-6 h-6 fill-neutral-600', {
                    'fill-neutral-900': router.pathname === item.link,
                  })}
                />
                <div className="hidden xl:block">{t(item.title)}</div>
                {item.id === MenuId.notifications && isNewUnread && (
                  <BadgeDot />
                )}
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex justify-center xl:justify-normal">
        <AddNoteDialog>
          <button
            className={cn(
              'h-11 w-11 xl:w-full px-0 xl:px-5 mt-6 bg-primary-600 hover:bg-primary-500 transition-colors rounded-full cursor-pointer border-none',
              {
                'bg-gray-500 hover:bg-gray-500 cursor-not-allowed': !isLoggedIn,
              },
            )}
          >
            <div className="flex justify-center items-center w-full gap-2">
              <Icon type="icon-Pencil" className="w-5 h-5 fill-white" />
              <span className="hidden xl:block text-white">
                {t('nav.menu.blogDashboard')}
              </span>
            </div>
          </button>
        </AddNoteDialog>
      </div>
    </nav>
  );
};

export default dynamic(() => Promise.resolve(Navbar), {
  ssr: false,
});
