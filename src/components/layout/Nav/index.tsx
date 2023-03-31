import { Paths } from 'constants/path';
import { useState } from 'react';
import { getDraftId } from 'utils/common';
import { useTranslation } from 'react-i18next';
import { useNotification } from 'hooks/useNotification';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { Dialog, DialogContent } from '@mui/material';
import {
  Home,
  Article,
  Create,
  AccountBox,
  PersonAdd,
  Backup,
  Notifications,
  LogoutRounded,
  LoginRounded
} from '@mui/icons-material';

import Link from 'next/link';
import LoginCard from '../LoginCard';
import styles from './index.module.scss';

const Nav = ({ isLoggedIn }) => {
  const { t } = useTranslation();
  const newNotifyCount = useNotification();
  const myPublicKey = useReadonlyMyPublicKey();
  const [isOpenLoginForm, setIsOpenLoginForm] = useState<boolean>(false);
  const isLogin = isLoggedIn && myPublicKey && myPublicKey.length > 0;

  return (
    <nav className={styles.nav}>
      <ul>
        <li>
          <Link href={Paths.home}>
            <img src="/logo512.png" alt="logo" />
          </Link>
        </li>

        <li>
          <Link href={Paths.home}>
            <Home />{t('nav.menu.home')}
          </Link>
        </li>

        <li>
          <Link href={Paths.blog}>
            <Article />{t('nav.menu.blog')}
          </Link>
        </li>

        {isLogin && (
          <li>
            <Link href={Paths.notification}>
              <Notifications />{t('nav.menu.notification')}
              {newNotifyCount > 0 && (
                <span>+{newNotifyCount}</span>
              )}
            </Link>
          </li>
        )}

        {isLogin ? (
          <li>
            <Link href={`${Paths.write}?did=${getDraftId()}`}>
              <Create />{t('nav.menu.blogDashboard')}
            </Link>
          </li>
        ) : (
          <li>
            <a onClick={() => alert('you need to sign in first!')}>
              <Create />{t('nav.menu.blogDashboard')}
            </a>
          </li>
        )}
        
        {isLogin && (
          <li>
            <Link href={`${Paths.contact + myPublicKey}`}>
              <PersonAdd />{t('nav.menu.contact')}
            </Link>
          </li>
        )}

        {isLogin ? (
          <li>
            <Link href={`${Paths.user + myPublicKey}`}>
              <AccountBox />{t('nav.menu.profile')}
            </Link>
          </li>
        ) : (
          <li>
            <a onClick={() => alert('you need to sign in first!')}>
              <AccountBox />{t('nav.menu.profile')}
            </a>
          </li>
        )}

        <li>
          <Link href={`${Paths.backup}?local=true`}>
            <Backup />{t('nav.menu.backup')}
          </Link>
        </li>

        <li>
          <a onClick={() => setIsOpenLoginForm(true)}>
          {isLoggedIn ? <>
            <LogoutRounded />
            {t('nav.menu.signOut')}
          </> : <>
            <LoginRounded />
            {t('nav.menu.signIn')}
          </>}
          </a>
        </li>
      </ul>

      <Dialog
        open={isOpenLoginForm}
        onClose={() => setIsOpenLoginForm(false)}
        disableAutoFocus
      >
        <DialogContent>
          <LoginCard onCancel={() => setIsOpenLoginForm(false)} />
        </DialogContent>
      </Dialog>
    </nav>
  )
};

export default Nav;