import { Paths } from 'constants/path';
import { useRouter } from 'next/router';
import { RootState } from 'store/configureStore';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Avatar, Badge, Drawer } from 'antd';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { EventSetMetadataContent } from 'core/nostr/type';
import { MenuId, NavMenus, UserMenus, navClick } from './utils';
import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { RelaySelector } from 'components/RelaySelector';
import { shortifyNPub } from 'core/nostr/content';
import { Nip19, Nip19DataType } from 'core/nip/19';
import { useNotification } from 'hooks/useNotification';

import Icon from 'components/Icon';
import styles from './index.module.scss';
import classNames from 'classnames';

interface Props {
  body: React.ReactNode[];
  user?: EventSetMetadataContent;
  setOpenWrite: Dispatch<SetStateAction<boolean>>;
}

const Mobile: React.FC<Props> = ({ body, user, setOpenWrite }) => {
  const router = useRouter();
  const isLoggedIn = useSelector(
    (state: RootState) => state.loginReducer.isLoggedIn,
  );
  const myPublicKey = useReadonlyMyPublicKey();
  const isNewUnread = useNotification();
  const dispatch = useDispatch();
  const doLogout = () => {
    dispatch({
      type: 'LOGOUT',
    });
    router.push(Paths.login);
  };

  const { t } = useTranslation();
  const [nav, setNav] = useState<typeof NavMenus>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
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
      icon: <Icon type="icon-plus" />,
      title: 'nav.menu.blogDashboard',
      link: Paths.write,
    });
    setNav(result);
  }, []);

  return (
    <div className={styles.mobile}>
      <header>
        {isLoggedIn ? (
          <Avatar src={user?.picture} onClick={() => setOpen(true)} />
        ) : (
          <Avatar
            icon={<Icon type="icon-user" />}
            onClick={() => router.push({ pathname: Paths.login })}
          />
        )}
        <div className="flex-1">
          <RelaySelector />
        </div>
      </header>
      <main>{body}</main>
      <footer>
        <ul>
          {nav.map((item, key) => (
            <li
              key={key}
              onClick={() => {
                item.id === MenuId.add
                  ? setOpenWrite(true)
                  : navClick(item, myPublicKey, router, isLoggedIn, t);
              }}
              className={classNames({
                [styles.active]: item.link === router.pathname,
                [styles.add]: item.id === MenuId.add,
              })}
            >
              {item.id === MenuId.add ? (
                <span>{item.icon}</span>
              ) : item.id === MenuId.notifications && isNewUnread ? (
                <Badge dot>{item.icon}</Badge>
              ) : (
                item.icon
              )}
            </li>
          ))}
        </ul>
      </footer>
      <Drawer
        title={null}
        placement={'left'}
        closable={false}
        width={'80vw'}
        onClose={() => setOpen(false)}
        open={open}
        className={styles.mobileDrawer}
      >
        <Icon
          type="icon-cross"
          className={styles.close}
          onClick={() => setOpen(false)}
        />
        <div className={styles.userTitle}>
          <Avatar src={user?.picture} />
          <h1>
            {user?.name ||
              user?.display_name ||
              shortifyNPub(Nip19.encode(myPublicKey, Nip19DataType.Npubkey))}
          </h1>
        </div>
        <ul>
          {UserMenus.map((item, key) => (
            <li
              key={key}
              onClick={() => {
                item?.id === MenuId.signOut
                  ? doLogout()
                  : navClick(item, myPublicKey, router, isLoggedIn, t);
              }}
            >
              {item?.icon} <span>{item && t(item.title)}</span>
            </li>
          ))}
        </ul>
      </Drawer>
    </div>
  );
};

export default Mobile;
