import { Grid, Link } from '@mui/material';
import { useCommitId } from 'hooks/useCommitId';
import { useVersion } from 'hooks/useVersion';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import logo from '../../../resource/logo512.png';
import LoginCard from './LoginCard';
import {
  Search,
  Home,
  Article,
  Create,
  AccountBox,
  Settings,
  Key,
  Contacts,
  Backup,
  Notifications,
} from '@mui/icons-material';
import styled from 'styled-components';
import { loginMapStateToProps } from 'app/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useNotification } from 'hooks/useNotification';

const styles = {
  root: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  title: {
    color: 'black',
    fontSize: '20px',
    fontWeight: '600',
    display: 'inline-flex',
    width: '100%',
  },
  ul: {
    padding: '0px 10px 0px 0px',
    borderRadius: '5px',
    listStyleType: 'none' as const,
  },
  li: {
    padding: '10px 0px',
    marginBottom: '5px',
    // background: "gray",
    //todo hover effect
    // width: "fit-content" as const,
    borderRadius: '5px',
    color: 'gray',
  },
  link: {
    color: 'white',
    textDecoration: 'none' as const,
  },
};

export interface NavHeaderProps {
  title?: string;
  link?: string;
}
export function NavHeader({ title, link }: NavHeaderProps) {
  const { t } = useTranslation();

  return (
    <Grid container>
      <Grid item xs={12} sm={6}>
        <div>
          <Grid container>
            <div style={styles.title}>
              <a
                href={link || '/'}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'black' }}
              >
                {title || t('nav.menu.home')}
              </a>
            </div>
          </Grid>
        </div>
      </Grid>
      {
        <Grid item xs={12} sm={6}>
          <div style={{ textAlign: 'right' }}>
            <SearchBox />
          </div>
        </Grid>
      }
    </Grid>
  );
}

export const SearchBox = () => {
  return (
    <div
      style={{
        //boxShadow: 'inset 0 0 1px #aaa',
        //border: '1px solid rgb(216 222 226)',
        borderRadius: '5px',
        background: '#F4F5F4',
        padding: '5px',
        // margin: '5px 0px 0px 0px',
        display: 'flex',
      }}
    >
      <input
        type="text"
        //placeholder="unavailable"
        style={{
          border: 'none',
          maxWidth: '85%',
          width: '400px',
          // padding: '5px',
          outline: 'none',
          background: '#F4F5F4',
        }}
      />
      <button
        type="button"
        style={{
          border: 'none',
          background: 'none',
          padding: '0px 5px',
          fontSize: 'small',
        }}
        //disabled={true}
        onClick={() => {
          alert('working on it!');
        }}
      >
        <Search />
      </button>
    </div>
  );
};

const NotificationCount = styled.span`
  display: inline-block;
  margin-left: 5px;
  padding: 3px 5px;
  border-radius: 50%;
  color: red;
  :hover {
    color: gray;
  }
`;

export const MenuList = ({ isLoggedIn }) => {
  const { t } = useTranslation();
  const version = useVersion() + '-' + useCommitId();
  const [isOpenLoginForm, setIsOpenLoginForm] = useState<boolean>(false);
  const [isOpenSetting, setIsOpenSetting] = useState<boolean>(false);

  const myPublicKey = useReadonlyMyPublicKey();
  // const myPublicKey: any = undefined;

  const newNotifyCount = useNotification();

  return (
    <div>
      <ul style={styles.ul}>
        <div
          style={{ textAlign: 'left', marginLeft: '10px', marginBottom: '5px' }}
        >
          <img src={logo} style={{ width: '45px' }} alt="" />
        </div>
        <MenuItem href="/">
          <div>
            <Home /> &nbsp;
            {t('nav.menu.home')}
          </div>
        </MenuItem>

        {isLoggedIn && myPublicKey && myPublicKey.length > 0 && (
          <MenuItem href="/notification">
            <div>
              <Notifications /> &nbsp;
              {t('nav.menu.notification')}
              {newNotifyCount > 0 && (
                <NotificationCount>+{newNotifyCount}</NotificationCount>
              )}
            </div>
          </MenuItem>
        )}

        <MenuItem href="/blog">
          <div>
            <Article /> &nbsp;
            {t('nav.menu.blog')}
          </div>
        </MenuItem>

        {isLoggedIn && myPublicKey && myPublicKey.length > 0 ? (
          <MenuItem href="/write">
            <div>
              <Create /> &nbsp;
              {t('nav.menu.blogDashboard')}
            </div>
          </MenuItem>
        ) : (
          <MenuItem
            href="/#"
            onClick={() => {
              alert('you need to sign in first!');
            }}
          >
            <div>
              <Create /> &nbsp;
              {t('nav.menu.blogDashboard')}
            </div>
          </MenuItem>
        )}

        {isLoggedIn && myPublicKey && myPublicKey.length > 0 && (
          <MenuItem href={'/contact/' + myPublicKey}>
            <div>
              <Contacts /> &nbsp;
              {t('nav.menu.contact')}
            </div>
          </MenuItem>
        )}

        {isLoggedIn && myPublicKey && myPublicKey.length > 0 ? (
          <MenuItem href={'/user/' + myPublicKey}>
            <div>
              <AccountBox /> &nbsp;
              {t('nav.menu.profile')}
            </div>
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              alert('you need to sign in first!');
            }}
          >
            <div>
              <AccountBox /> &nbsp;
              {t('nav.menu.profile')}
            </div>
          </MenuItem>
        )}

        <MenuItem href={'/backup?local=true'}>
          <div>
            <Backup /> &nbsp;
            {t('nav.menu.backup')}
          </div>
        </MenuItem>

        <MenuItem
          onClick={() => {
            setIsOpenLoginForm(true);
          }}
        >
          <div>
            {' '}
            <Key /> &nbsp;
            {isLoggedIn ? t('nav.menu.signOut') : t('nav.menu.signIn')}
          </div>
        </MenuItem>
        {isOpenLoginForm && (
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              padding: '20px',
              zIndex: 999,
              width: '400px',
              height: 'auto',
              boxShadow: '0px 0px 10px #ccc',
              borderRadius: '5px',
              textAlign: 'center',
            }}
          >
            <LoginCard onCancel={() => setIsOpenLoginForm(false)} />
          </div>
        )}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 998,
            background: 'black',
            opacity: 0.5,
            filter: 'blur(5px)',
            display: isOpenLoginForm ? 'block' : 'none',
          }}
        ></div>
      </ul>
    </div>
  );
};

export const MenuListDefault = connect(loginMapStateToProps)(MenuList);

interface MenuItemProps {
  children: React.ReactNode;
  href?: string;
  target?: string;
  onClick?: () => any;
}

const Li = styled.li`
  font-size: 16px;
  font-weight: 400;
  padding: 10px 5px;
  margin-bottom: 5px;
  background: none;
  color: gray;
  cursor: pointer;
  border-radius: 5px;
  :hover {
    background: rgb(141, 197, 63);
    color: white;
  }
`;

const MenuItem = ({ children, href, target, onClick }: MenuItemProps) => {
  const defaultOnClick = () => {
    window.open(href || '#', target || '_self');
  };
  return <Li onClick={onClick || defaultOnClick}>{children}</Li>;
};

export const LoginFormTip = ({
  style = {},
  text,
}: {
  style?: React.CSSProperties;
  text?: string;
}) => {
  const { t } = useTranslation();
  const [isOpenLoginForm, setIsOpenLoginForm] = useState<boolean>(false);
  return (
    <>
      <button
        style={{
          ...{ border: 'none', background: 'lightsteelblue' },
          ...style,
        }}
        type="button"
        onClick={() => {
          setIsOpenLoginForm(!isOpenLoginForm);
        }}
      >
        {text || t('nav.menu.signIn')}
      </button>
      {isOpenLoginForm && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '20px',
            zIndex: 999,
            width: '400px',
            height: 'auto',
            boxShadow: '0px 0px 10px #ccc',
            borderRadius: '5px',
            textAlign: 'center',
          }}
        >
          <LoginCard onCancel={() => setIsOpenLoginForm(false)} />
        </div>
      )}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 998,
          background: 'black',
          opacity: 0.5,
          filter: 'blur(5px)',
          display: isOpenLoginForm ? 'block' : 'none',
        }}
      ></div>
    </>
  );
};
