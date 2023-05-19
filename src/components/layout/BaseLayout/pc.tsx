import { Paths } from 'constants/path';
import { useRouter } from 'next/router';
import { RootState } from 'store/configureStore';
import { useSelector } from 'react-redux';
import { useMatchPad } from 'hooks/useMediaQuery';
import { MenuItemType } from 'antd/es/menu/hooks/useItems';
import { useTranslation } from 'react-i18next';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { EventSetMetadataContent } from 'service/api';
import { Avatar, Button, Dropdown } from 'antd';
import { MenuId, NavMenus, UserMenus, navClick } from './utils';

import Link from 'next/link';
import Icon from 'components/Icon';
import styles from './index.module.scss';
import dynamic from 'next/dynamic';
import { UserOutlined } from '@ant-design/icons';

const PcPadNav = ({ user }: { user?: EventSetMetadataContent }) => {
  const { t } = useTranslation();
  const isPad = useMatchPad();
  const router = useRouter();
  const myPublicKey = useReadonlyMyPublicKey();
  const isLoggedIn = useSelector((state: RootState) => state.loginReducer.isLoggedIn);
  
  const userMenus = UserMenus.reduce((result, item) => {
    if (!item || item.id === MenuId.bookmarks) return result;

    result.push({
      icon: item?.icon,
      key: item?.id,
      label: t(item?.title),
      onClick: () => navClick(item, myPublicKey, router, isLoggedIn, t),
    });
    return result;
  }, [] as MenuItemType[]);

  return (
    <nav className={styles.pcPadNav}>
      <div className={styles.logo}>
        <Link href={Paths.home}>
          <img src="/logo512.png" alt="logo" />
        </Link>
      </div>
      <ul>
        <li>
          { 
            <Dropdown 
            menu={{ items: isLoggedIn ? userMenus : [] }} 
            overlayClassName={styles.pcPadNavUserMenu}
            placement='bottom'
            arrow
          >
            <div className={styles.user} onClick={() => isLoggedIn ? null : router.push({ pathname: Paths.login })}>
              { user ? <Avatar src={user.picture} /> : <Avatar icon={<UserOutlined />} /> }
              <h1>{ user ? user.display_name || user.name : t('nav.menu.signIn')}</h1>
            </div>
          </Dropdown>
          }
        </li>
        { NavMenus.map((item, key) => (
            <li 
              key={key} 
              className={router.pathname === item.link ? styles.active : ''}
              onClick={() => navClick(item, myPublicKey, router, isLoggedIn, t)}
            >{ item.icon }<span>{ t(item.title) }</span></li>
          )
        )}
      </ul>
      <Button
        block={isPad ? false : true}
        type="primary"
        shape={isPad ? "circle" : 'default'}
        icon={isPad ? <Icon type='icon-Pencil' /> : null}
        onClick={() => navClick({
          id: MenuId.add,
          link: Paths.write
        }, myPublicKey, router, isLoggedIn, t)}
        disabled={!isLoggedIn}
      >
        { !isPad && t('nav.menu.blogDashboard') }
      </Button>
    </nav>
  )
};

export default dynamic(() => Promise.resolve(PcPadNav), {
  ssr: false,
});
