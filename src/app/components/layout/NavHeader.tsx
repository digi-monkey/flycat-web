import { Grid } from '@mui/material';
import { useCommitId } from 'hooks/useCommitId';
import { useVersion } from 'hooks/useVersion';
import React from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import logo from '../../../resource/logo512.png';

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
  return (
    <Grid container spacing={2}>
      <Grid item xs={4}>
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
      <Grid item xs={8} style={{ textAlign: 'right' }}>
        <div className="menu" style={{ width: 'fit-content', float: 'right' }}>
          <ul style={styles.ul}>
            <li style={styles.li}>
              <a href="/">{t('nav.menu.home')}</a>
            </li>
            <li style={styles.li}>
              <a href={'/user/' + myPublicKey}>{t('nav.menu.profile')}</a>
            </li>
            <li style={styles.li}>
              <a href={'/blog/' + myPublicKey}>{t('nav.menu.blog')}</a>
            </li>
            <li style={styles.li}>
              <a
                href="https://github.com/digi-monkey/flycat-web"
                target="_blank"
                rel="noreferrer"
              >
                {t('nav.menu.github')}
              </a>
            </li>
            <li style={styles.li}>
              <a href="">{t('nav.menu.globalFeed')}</a>
            </li>
            <li style={styles.li}>
              <a href="">{t('nav.menu.setting')}</a>
            </li>
            {isLoggedIn && (
              <li style={styles.li}>
                <a href="">{t('nav.menu.signOut')}</a>
              </li>
            )}

            {!isLoggedIn && (
              <li style={styles.li}>
                <a href="">{t('nav.menu.signOut')}</a>
              </li>
            )}
          </ul>
        </div>
      </Grid>
    </Grid>
  );
}

export default connect(mapStateToProps)(NavHeader);
