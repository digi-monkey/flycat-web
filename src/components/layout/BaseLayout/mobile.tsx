import { Paths } from 'constants/path';
import { useRouter } from 'next/router';
import { RootState } from 'store/configureStore';
import { useSelector } from 'react-redux';
import { UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Avatar, Drawer } from 'antd';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { EventSetMetadataContent } from 'service/api';
import { MenuId, NavMenus, UserMenus, navClick } from './utils';
import { useEffect, useState, Dispatch, SetStateAction } from 'react';

import Icon from 'components/Icon';
import styles from './index.module.scss';
import classNames from 'classnames';

interface Props {
  body: React.ReactNode[],
  user?: EventSetMetadataContent,
  setOpenWrite: Dispatch<SetStateAction<boolean>>
}

const Mobile: React.FC<Props> = ({ body, user, setOpenWrite }) => {
  const router = useRouter();
  const isLoggedIn = useSelector((state: RootState) => state.loginReducer.isLoggedIn);
  const myPublicKey = useReadonlyMyPublicKey();
  
  const { t } = useTranslation();
  const [nav, setNav] = useState<typeof NavMenus>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const result = NavMenus.filter(item => [MenuId.home, MenuId.explore, MenuId.relays, MenuId.notifications].includes(item.id));
    result.splice(2, 0, {
      id: MenuId.add,
      icon: <Icon type='icon-plus' />,
      title: 'nav.menu.blogDashboard',
      link: Paths.write
    });
    setNav(result);
  }, []);
  
  return <div className={styles.mobile}>
    <header>
      { isLoggedIn && user ? <Avatar src={user.picture} onClick={() => setOpen(true)} /> : <Avatar icon={<UserOutlined />} onClick={() => router.push({ pathname: Paths.login })} />}
      <img src="/logo512.png" alt="LOGO" />
      <Icon type='icon-Plug' />
    </header>
    <main>{body}</main>
    <footer>
      <ul>
        { nav.map((item, key) => (
          <li 
            key={key} 
            onClick={() => navClick(item, myPublicKey, router, isLoggedIn, t)} 
            className={classNames({
              [styles.active]: item.link === router.pathname,
              [styles.add]: item.id === MenuId.add
            })}
          >
            { item.id === MenuId.add ? <span onClick={() => setOpenWrite(true)}>{ item.icon }</span> : item.icon }
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
      <Icon type='icon-cross' className={styles.close} onClick={() => setOpen(false)} />
      <div className={styles.userTitle}>
        <Avatar src={user?.picture} />
        <h1>{user?.display_name || user?.name}</h1>
      </div>
      <ul>
        { UserMenus.map((item, key) => <li key={key} onClick={() => navClick(item, myPublicKey, router, isLoggedIn, t)}>{item?.icon} <span>{item && t(item.title)}</span></li>) }
      </ul>
    </Drawer>
  </div>;
}

export default Mobile;
