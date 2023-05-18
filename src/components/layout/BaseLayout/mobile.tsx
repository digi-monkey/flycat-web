import { Paths } from 'constants/path';
import { UserMap } from 'service/type';
import { useRouter } from 'next/router';
import { RootState } from 'store/configureStore';
import { getDraftId } from 'utils/common';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Avatar, Drawer } from 'antd';
import { useEffect, useState } from 'react';
import { NavMenus, UserMenus } from '../Nav';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';

import Icon from 'components/Icon';
import classNames from 'classnames';
import styles from './index.module.scss';

interface Props {
  body: React.ReactNode[],
  userMap: UserMap
}

const Mobile: React.FC<Props> = ({ body, userMap }) => {
  const router = useRouter();
  const myPublicKey = useReadonlyMyPublicKey();
  const isLoggedIn = useSelector((state: RootState) => state.loginReducer.isLoggedIn);
  
  const { t } = useTranslation();
  const [nav, setNav] = useState<typeof NavMenus>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const result = NavMenus.filter(item => ['home', 'explore', 'relays', 'notifications'].includes(item.id));
    result.splice(2, 0, {
      id: 'add',
      icon: <Icon type='icon-plus' />,
      title: 'nav.menu.blogDashboard',
      link: `${Paths.write}?did=${getDraftId()}`
    });
    setNav(result);
  }, []);

  const navClick = (item) => {
    if (item.id === 'profile') {
      router.push({ pathname: item.link + myPublicKey });
    } else {
      router.push({ pathname: item.link });
    }
  }

  const user = userMap.get(myPublicKey);
  
  return <div className={styles.mobile}>
    <header>
      {/* { isLoggedIn ? <Avatar src={user.picture} onClick={() => setOpen(true)} /> : <Avatar icon={<UserOutlined />} onClick={() => router.push({ pathname: Paths.login })} />} */}
      <img src="/logo512.png" alt="LOGO" />
      <Icon type='icon-Plug' />
    </header>
    <main>
      {body}
    </main>
    <footer>
      <ul>
        { nav.map((item, key) => (
          <li 
            key={key} 
            onClick={() => navClick(item)} 
            className={classNames({
              [styles.active]: item.link === router.pathname,
              [styles.add]: item.id === 'add'
            })}
          >
            { item.id === 'add' ? <span>{ item.icon }</span> : item.icon }
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
          <h1>{user?.name}</h1>
        </div>
        <ul>
          { UserMenus.map((item, key) => <li key={key} onClick={() => navClick(item)}>{item?.icon} <span>{item && t(item.title)}</span></li>) }
        </ul>
      </Drawer>
  </div>;
}

export default Mobile;
