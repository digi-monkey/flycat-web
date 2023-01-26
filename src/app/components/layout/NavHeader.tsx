import { Grid } from '@mui/material';
import { useCommitId } from 'hooks/useCommitId';
import { useVersion } from 'hooks/useVersion';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import logo from '../../../resource/logo512.png';
import LoginForm from './LoginForm';
import Setting from './Setting';

const styles = {
  root: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  title: {
    color: 'black',
    fontSize: '2em',
    fontWeight: '380',
    display: 'inline-flex',
    width: '100%',
  },
  ul: {
    padding: '10px',
    background: 'white',
    borderRadius: '5px',
  },
  li: {
    display: 'inline',
    padding: '10px',
  },
};

const mapStateToProps = state => {
  return {
    isLoggedIn: state.loginReducer.isLoggedIn,
    myPublicKey: state.loginReducer.publicKey,
    myPrivateKey: state.loginReducer.privateKey,
  };
};

export function NavHeader({ isLoggedIn, myPublicKey, myPrivateKey }) {
  const { t } = useTranslation();
  const version = useVersion() + '-' + useCommitId();

  const [isOpenLoginForm, setIsOpenLoginForm] = useState<boolean>(false);
  const [isOpenSetting, setIsOpenSetting] = useState<boolean>(false);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <div>
          <Grid container>
            <Grid item xs={3} style={{ display: 'flex', alignItems: 'center' }}>
              <img src={logo} style={{ width: '60px' }} alt="" />
            </Grid>
            <Grid item xs={9}>
              <span style={{ fontSize: '10px', color: 'gray' }}>
                v{version}
              </span>
              <br />
              <span style={styles.title}>飞猫FlyCat </span>
            </Grid>
          </Grid>
        </div>
      </Grid>
      <Grid item xs={12} sm={8} style={{ textAlign: 'right' }}>
        <div className="menu" style={{ width: 'fit-content', float: 'right' }}>
          <ul style={styles.ul}>
            <li style={styles.li}>
              <a href="/">{t('nav.menu.home')}</a>
            </li>
            <li style={styles.li}>
              <a href={'/blog'}>{t('nav.menu.blog')}</a>
            </li>
            <li style={styles.li}>
              <a href={'/user/' + myPublicKey}>{t('nav.menu.profile')}</a>
            </li>
            <li style={styles.li}>
              <a href={'/blog/' + myPublicKey}>{t('nav.menu.blogDashboard')}</a>
            </li>
            {/** 
            <li style={styles.li}>
              <a href="">{t('nav.menu.globalFeed')}</a>
            </li>
            */}
            <li style={styles.li}>
              <a
                href="#"
                onClick={() => {
                  setIsOpenSetting(true);
                }}
              >
                {t('nav.menu.setting')}
              </a>
            </li>
            {isOpenSetting && (
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
                <Setting
                  version={version}
                  onCancel={() => setIsOpenSetting(false)}
                />
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
                display: isOpenSetting ? 'block' : 'none',
              }}
            ></div>

            <li style={styles.li}>
              <a
                href="#"
                onClick={() => {
                  setIsOpenLoginForm(true);
                }}
              >
                {isLoggedIn ? t('nav.menu.signOut') : t('nav.menu.signIn')}
              </a>
            </li>
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
                <LoginForm onCancel={() => setIsOpenLoginForm(false)} />
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
      </Grid>
    </Grid>
  );
}

export default connect(mapStateToProps)(NavHeader);
