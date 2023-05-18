import { Paths } from 'constants/path';
import { Button } from 'antd';
import { UserMap } from 'service/type';
import { isEmptyStr } from 'service/helper';
import { getDraftId } from 'utils/common';
import { useSelector } from 'react-redux';
import { useMatchPad } from 'hooks/useMediaQuery';
import { useCallWorker } from 'hooks/useWorker';
import { CallRelayType } from 'service/worker/type';
import { useTranslation } from 'react-i18next';
import { useNotification } from 'hooks/useNotification';
import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import {
  Event,
  WellKnownEventKind,
  EventSetMetadataContent,
  deserializeMetadata,
} from 'service/api';

import Link from 'next/link';
import styles from './index.module.scss';
import Icon from 'components/Icon';
import UserMenu from 'components/UserMenu';

export const NavMenus = [{
  id: 'home',
  icon: <Icon type="icon-home" />,
  title: 'nav.menu.home',
  link: Paths.home
}, {
  id: 'explore',
  icon: <Icon type="icon-explore" />,
  title: 'nav.menu.explore',
  link: Paths.blog
}, {
  id: 'relays',
  icon: <Icon type="icon-Relay" />,
  title: 'nav.menu.relays',
  link: Paths.relay
}, {
  id: 'bookmarks',
  icon: <Icon type="icon-bookmark" />,
  title: 'nav.menu.bookmarks',
  link: Paths.bookmarks
}, {
  id: 'notifications',
  icon: <Icon type="icon-notification" />,
  title: 'nav.menu.notifications',
  link: Paths.notification
}];

export const UserMenus = [{
  id: 'profile',
  icon: <Icon type="icon-user" />,
  title: 'nav.menu.profile',
  link: Paths.user
}, 
NavMenus[3],
,{
  id: 'drafts',
  icon: <Icon type="icon-Draft" />,
  title: 'nav.menu.drafts',
  link: Paths.home
}, {
  id: 'settings',
  icon: <Icon type="icon-Gear" />,
  title: 'nav.menu.setting',
  link: Paths.home
}, {
  id: 'backup',
  icon: <Icon type="icon-Data" />,
  title: 'nav.menu.backup',
  link: Paths.home
}, {
  id: 'signOut',
  icon: <Icon type="icon-Move-out" />,
  title: 'nav.menu.signOut',
  link: Paths.home
}];

const Nav = ({ isLoggedIn }) => {
  const { t } = useTranslation();
  const newNotifyCount = useNotification();
  const myPublicKey = useReadonlyMyPublicKey();
  const isLogin = isLoggedIn && myPublicKey && myPublicKey.length > 0;
  const isPad = useMatchPad();
  // const isLoggedIn = useSelector((state: RootState) => state.loginReducer.isLoggedIn);

  const { worker, newConn } = useCallWorker();
  const [userMap, setUserMap] = useState<UserMap>(new Map());

  function handleEvent(event: Event, relayUrl?: string) {
    switch (event.kind) {
      case WellKnownEventKind.set_metadata:
        const metadata: EventSetMetadataContent = deserializeMetadata(
          event.content,
        );
        setUserMap(prev => {
          const newMap = new Map(prev);
          const oldData = newMap.get(event.pubkey);
          if (oldData && oldData.created_at > event.created_at) {
            // the new data is outdated
            return newMap;
          }

          newMap.set(event.pubkey, {
            ...metadata,
            ...{ created_at: event.created_at },
          });
          return newMap;
        });
        break;

      default:
        break;
    }
  }

  useEffect(() => {
    if (newConn.length === 0) return;

    if (!isEmptyStr(myPublicKey) && userMap.get(myPublicKey) == null) {
      worker
        ?.subMetadata([myPublicKey], undefined, undefined, {
          type: CallRelayType.batch,
          data: newConn,
        })
        ?.iterating({ cb: handleEvent });
    }
  }, [newConn]);

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <Link href={Paths.home}>
          <img src="/logo512.png" alt="logo" />
        </Link>
      </div>

      <ul>
        <li>
        {isLoggedIn && (
            <UserMenu
              pk={myPublicKey}
              userInfo={userMap.get(myPublicKey)}
            />
          )}
        </li>
        {
          NavMenus.map((item, key) => (
            <li key={key}>
              { item.icon }
              <span>{ t(item.title) }</span>
            </li>
          ))
        }
      </ul>
      {
        isPad ? (
          <Button icon={<Icon type='icon-Pencil' />}></Button>
        ) : (
          <Button>{ t('nav.menu.blogDashboard') }</Button>
        )
      }
    </nav>
  )
};

export default Nav;
