import { Grid } from '@mui/material';
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
    diplay: 'block',
    width: '100%',
    margin: '5px',
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
  return (
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <div style={styles.title}>
          <img
            src={logo}
            style={{ width: '48px', height: '48px', marginRight: '5px' }}
            alt=""
          />
          飞猫FlyCat{' '}
          <span style={{ fontSize: '14px', color: 'red' }}>测试版</span>{' '}
        </div>
        <small style={{ color: 'black' }}>开源的 nostr 中文客户端</small>
        &nbsp;
        <small>
          <a href="https://github.com/digi-monkey/flycat-web">Github</a>
        </small>
      </Grid>
      <Grid item xs={8}>
        <div className="menu">
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
              <a href="">私信</a>
            </li>
            <li style={styles.li}>
              <a href="">连接器</a>
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
