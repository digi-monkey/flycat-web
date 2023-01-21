import { Grid } from '@mui/material';
import { useCommitId } from 'hooks/useCommitId';
import { useVersion } from 'hooks/useVersion';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { PrivateKey, PublicKey } from 'service/api';
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
    diplay: 'inline-flex;',
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

interface KeyPair {
  publicKey: PublicKey;
  privateKey: PrivateKey;
}

const mapStateToProps = state => {
  return {
    isLoggedIn: state.loginReducer.isLoggedIn,
    myPublicKey: state.loginReducer.publicKey,
    myPrivateKey: state.loginReducer.privateKey,
  };
};

export function NavHeader({ isLoggedIn, myPublicKey, myPrivateKey }) {
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
              <a href="/">首页</a>
            </li>
            <li style={styles.li}>
              <a href={'/user/' + myPublicKey}>我的空间</a>
            </li>
            <li style={styles.li}>
              <a href={'/blog/' + myPublicKey}>公众号</a>
            </li>
            <li style={styles.li}>
              <a
                href="https://github.com/digi-monkey/flycat-web"
                target="_blank"
                rel="noreferrer"
              >
                Github
              </a>
            </li>
            <li style={styles.li}>
              <a href="">随便看看</a>
            </li>
            <li style={styles.li}>
              <a href="">设置</a>
            </li>
            {isLoggedIn && (
              <li style={styles.li}>
                <a href="">退出</a>
              </li>
            )}

            {!isLoggedIn && (
              <li style={styles.li}>
                <a href="">登陆</a>
              </li>
            )}
          </ul>
        </div>
      </Grid>
    </Grid>
  );
}

export default connect(mapStateToProps)(NavHeader);
