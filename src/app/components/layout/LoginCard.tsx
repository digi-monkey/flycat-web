import { Button, Grid } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import {
  Nip19DataPrefix,
  Nip19DataType,
  nip19Decode,
  nip19Encode,
} from 'service/api';
import { getPublicKey, matchKeyPair, randomKeyPair } from 'service/crypto';
import { login, LoginMode, LoginRequest } from 'store/loginReducer';
import { ThinHr } from './ThinHr';
import { isDotBitName, isNip05DomainName } from 'service/helper';
import ControlPointIcon from '@mui/icons-material/ControlPoint';

const styles = {
  pk: {
    fontSize: '12px',
    color: 'gray',
    display: 'block',
    marginBottom: '10px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '500',
    display: 'block',
    margin: '10px 0px 20px 0px',
  },
  input: {
    width: '100%',
    display: 'block',
    marginBottom: '5px',
    padding: '5px',
  },
};

export interface LoginFormProps {
  isLoggedIn;
  doLogin;
  doLogout;
  onCancel: () => any;
}

const LoginCard = ({
  isLoggedIn,
  doLogin,
  doLogout,
  onCancel,
}: LoginFormProps) => {
  const { t } = useTranslation();

  const myPublicKey = useReadonlyMyPublicKey();
  const [privKeyInputValue, setPrivKeyInputValue] = useState<string>('');
  const [createdNewPublicKey, setCreatedNewPublicKey] = useState<string>();
  const [readonlyInputValue, setReadonlyInputValue] = useState<string>('');

  const newKeyPair = () => {
    const data = randomKeyPair();
    setCreatedNewPublicKey(data.pubKey);
    setPrivKeyInputValue(data.privKey);
  };

  const signWithNip07Wallet = async () => {
    if (typeof window.webln !== 'undefined') {
      await window.webln.enable();
      console.debug('lighting wallet: window.webln enabled');
    }

    if (!window.nostr) {
      return alert(
        'window.nostr not found! did you install the Nip07 wallet extension?',
      );
    }

    const loginRequest: LoginRequest = {
      mode: LoginMode.nip07Wallet,
    };
    doLogin(loginRequest);
  };

  const signWithDotBit = async (didAlias: string) => {
    const loginRequest: LoginRequest = {
      mode: LoginMode.dotbit,
      didAlias: didAlias,
    };
    doLogin(loginRequest);
  };

  const signWithDomainNameNip05 = async (nip05DomainName: string) => {
    const loginRequest: LoginRequest = {
      mode: LoginMode.nip05Domain,
      nip05DomainName: nip05DomainName,
    };
    doLogin(loginRequest);
  };

  const signWithPublicKey = async (pubKey: string) => {
    if (typeof pubKey !== 'string') {
      alert('typeof pubKey !== "string"');
      return;
    }

    if (pubKey.startsWith(Nip19DataPrefix.Pubkey)) {
      const res = nip19Decode(pubKey);
      if (res.type !== Nip19DataType.Pubkey) {
        return alert('bech32 encoded publickey decoded err');
      }
      pubKey = res.data;
    }

    if (pubKey.length !== 64) {
      alert('only support 32 bytes hex publicKey now, wrong length');
      return;
    }

    const loginRequest: LoginRequest = {
      mode: LoginMode.local,
      publicKey: pubKey,
    };
    doLogin(loginRequest);
  };

  const signWithReadonly = async () => {
    if (isNip05DomainName(readonlyInputValue)) {
      return signWithDomainNameNip05(readonlyInputValue);
    }

    if (isDotBitName(readonlyInputValue)) {
      return signWithDotBit(readonlyInputValue);
    }

    return signWithPublicKey(readonlyInputValue);
  };

  const signWithPrivateKey = () => {
    let privKey = privKeyInputValue;
    if (privKey.length === 0) {
      return alert('please input privKey!');
    }

    if (privKey.startsWith(Nip19DataPrefix.Privkey)) {
      const res = nip19Decode(privKey);
      if (res.type !== Nip19DataType.Privkey) {
        return alert('bech32 encoded privkey decoded err');
      }
      privKey = res.data;
    }

    if (privKey.length !== 64) {
      alert('only support 32 bytes hex private key now, wrong length');
      return;
    }

    let pubKey = getPublicKey(privKey);

    const loginRequest: LoginRequest = {
      mode: LoginMode.local,
      publicKey: pubKey,
      privateKey: privKey,
    };
    doLogin(loginRequest);
  };

  if (isLoggedIn) {
    return (
      <div>
        <div style={{ width: '100%', height: '60px', textAlign: 'right' }}>
          <IconButton onClick={onCancel} aria-label="delete">
            <CancelOutlinedIcon />
          </IconButton>
        </div>
        <span style={styles.title}>{t('loginForm.welcome')}</span>
        <span style={styles.pk}>
          {myPublicKey &&
            t('loginForm.signAs') +
              ' ' +
              nip19Encode(myPublicKey, Nip19DataType.Pubkey)}
        </span>
        <div style={{ margin: '10px 0px' }}>
          <Button
            fullWidth
            type="button"
            variant="contained"
            color="success"
            onClick={doLogout}
          >
            {t('loginForm.signOut')}
          </Button>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <div style={{ width: '100%', height: '60px', textAlign: 'right' }}>
          <IconButton onClick={onCancel} aria-label="delete">
            <CancelOutlinedIcon />
          </IconButton>
        </div>
        <span style={styles.title}>{t('loginForm.title')}</span>
        <div style={{ margin: '10px 0px' }}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            onClick={signWithNip07Wallet}
          >
            {t('loginForm.signWithNip07')}
          </Button>
          <span style={{ fontSize: '12px', color: 'gray', display: 'block' }}>
            {t('loginForm.recommend')}
          </span>
        </div>

        <ThinHr />

        <div>
          <span style={styles.title}>{t('loginForm.readonlyMode')}</span>
          <input
            type="text"
            placeholder={'publicKey/nip05DomainName/.bit'}
            name="dotbitDomainName"
            style={styles.input}
            value={readonlyInputValue}
            onChange={event => setReadonlyInputValue(event.target.value)}
          />
          <div style={{ margin: '10px 0px' }}>
            <Button
              fullWidth
              type="button"
              onClick={signWithReadonly}
              variant="contained"
              color="success"
            >
              {t('loginForm.signIn')}
            </Button>
          </div>
        </div>

        <ThinHr />

        <div>
          <span style={styles.title}>
            {t('loginForm.signInWithPrivKeyTitle')}
          </span>
          {createdNewPublicKey && (
            <small>{t('loginForm.backUpPrivKeyHint')}</small>
          )}
          <input
            type="text"
            placeholder={t('loginForm.privKey')}
            name="privateKey"
            style={styles.input}
            value={privKeyInputValue}
            onChange={event => setPrivKeyInputValue(event.target.value)}
          />
          <div style={{ margin: '10px 0px' }}>
            <Button
              fullWidth
              type="button"
              onClick={signWithPrivateKey}
              variant="contained"
              color="success"
            >
              {t('loginForm.signIn')}
            </Button>
            <button
              type="button"
              onClick={newKeyPair}
              style={{
                border: 'none',
                background: 'none',
              }}
            >
              {t('loginForm.genNewKey')}
            </button>
          </div>
        </div>
      </div>
    );
  }
};

const logout = () => ({
  type: 'LOGOUT',
});

const mapStateToProps = state => ({
  isLoggedIn: state.loginReducer.isLoggedIn,
  publicKey: state.loginReducer.publicKey,
  privateKey: state.loginReducer.privateKey,
});

const mapDispatchToProps = dispatch => ({
  doLogin: (request: LoginRequest) => dispatch(login(request)),
  doLogout: () => dispatch(logout()),
});

export default connect(mapStateToProps, mapDispatchToProps)(LoginCard);
