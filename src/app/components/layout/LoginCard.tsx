import { Button } from '@mui/material';
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
import { matchKeyPair, randomKeyPair } from 'service/crypto';
import {
  login,
  LoginActionType,
  LoginMode,
  LoginRequest,
} from 'store/loginReducer';
import { ThinHr } from './ThinHr';

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
  const [pubKeyInputValue, setPubKeyInputValue] = useState<string>('');
  const [privKeyInputValue, setPrivKeyInputValue] = useState<string>('');
  const [dotBitInputValue, setDotBitInputValue] = useState<string>('');
  const [domainNameInputValue, setDomainNameInputValue] = useState<string>('');

  const newKeyPair = () => {
    const data = randomKeyPair();
    setPubKeyInputValue(data.pubKey);
    setPrivKeyInputValue(data.privKey);
  };

  const signWithNip07 = async () => {
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

  const signWithDotBit = async () => {
    const loginRequest: LoginRequest = {
      mode: LoginMode.dotbit,
      didAlias: dotBitInputValue,
    };
    doLogin(loginRequest);
  };

  const signWithDomainNameNip05 = async () => {
    const loginRequest: LoginRequest = {
      mode: LoginMode.nip05Domain,
      nip05DomainName: domainNameInputValue,
    };
    doLogin(loginRequest);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let pubKey = event.currentTarget.publicKey.value;
    let privKey = event.currentTarget.privateKey.value;

    if (typeof pubKey !== 'string') {
      alert('typeof pubKey !== "string"');
      return;
    }
    if (typeof privKey !== 'string') {
      alert('typeof privKey !== "string"');
      return;
    }

    if (pubKey.startsWith(Nip19DataPrefix.Pubkey)) {
      const res = nip19Decode(pubKey);
      if (res.type !== Nip19DataType.Pubkey) {
        return alert('bech32 encoded publickey decoded err');
      }
      pubKey = res.data;
      console.log(pubKey, pubKey.length);
    }

    if (pubKey.length !== 64) {
      alert('only support 32 bytes hex publicKey now, wrong length');
      return;
    }

    if (privKey.length > 0) {
      if (privKey.startsWith(Nip19DataPrefix.Privkey)) {
        const res = nip19Decode(privKey);
        if (res.type !== Nip19DataType.Privkey) {
          return alert('bech32 encoded privkey decoded err');
        }
        privKey = res.data;
      }

      if (pubKey.length !== 64) {
        alert('only support 32 bytes hex private key now, wrong length');
        return;
      }

      if (!matchKeyPair(pubKey, privKey)) {
        alert('public key and private key not matched!');
        return;
      }
    }

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
            variant="outlined"
            color="success"
            onClick={doLogout}
          >
            {t('loginForm.signOut')}
          </Button>
        </div>
        <div style={{ margin: '10px 0px' }}>
          <Button
            fullWidth
            type="button"
            variant="outlined"
            color="success"
            onClick={onCancel}
          >
            {t('loginForm.cancel')}
          </Button>
        </div>
      </div>
    );
  } else {
    return (
      <form onSubmit={onSubmit}>
        <span style={styles.title}>{t('nav.menu.signIn')}</span>
        <div style={{ margin: '10px 0px' }}>
          <Button
            fullWidth
            variant="outlined"
            color="success"
            onClick={signWithNip07}
          >
            {t('loginForm.signWithNip07')}
          </Button>
          <span style={{ fontSize: '12px', color: 'gray', display: 'block' }}>
            Recommend
          </span>
        </div>

        <ThinHr />

        <span style={styles.title}>{'With Key Pair'}</span>
        <label>
          <input
            type="text"
            placeholder={t('loginForm.pubKey') + t('loginForm.pkHint')}
            name="publicKey"
            style={styles.input}
            value={pubKeyInputValue}
            onChange={event => setPubKeyInputValue(event.target.value)}
          />
          <input
            type="text"
            placeholder={t('loginForm.privKey') + t('loginForm.privHint')}
            name="privateKey"
            style={styles.input}
            value={privKeyInputValue}
            onChange={event => setPrivKeyInputValue(event.target.value)}
          />
        </label>
        <div style={{ margin: '10px 0px' }}>
          <Button
            fullWidth
            type="button"
            variant="outlined"
            color="success"
            onClick={newKeyPair}
          >
            {t('loginForm.genNewKey')}
          </Button>
        </div>
        <div style={{ margin: '10px 0px' }}>
          <Button fullWidth type="submit" variant="outlined" color="success">
            {t('loginForm.signIn')}
          </Button>
        </div>
        <ThinHr />
        <span style={styles.title}>{'Dotbit'}</span>
        <div>
          <input
            type="text"
            placeholder={'example.bit'}
            name="dotbitDomainName"
            style={styles.input}
            value={dotBitInputValue}
            onChange={event => setDotBitInputValue(event.target.value)}
          />
          <div style={{ margin: '10px 0px' }}>
            <Button
              fullWidth
              type="button"
              onClick={signWithDotBit}
              variant="outlined"
              color="success"
            >
              {t('loginForm.signIn')}
            </Button>
          </div>
        </div>
        <ThinHr />

        <span style={styles.title}>{'DomainName Nip05'}</span>
        <div>
          <input
            type="text"
            placeholder={'user@domain.com'}
            name="nip05DomainName"
            style={styles.input}
            value={domainNameInputValue}
            onChange={event => setDomainNameInputValue(event.target.value)}
          />
          <div style={{ margin: '10px 0px' }}>
            <Button
              fullWidth
              type="button"
              onClick={signWithDomainNameNip05}
              variant="outlined"
              color="success"
            >
              {t('loginForm.signIn')}
            </Button>
          </div>
        </div>

        <ThinHr />
        <div style={{ margin: '10px 0px' }}>
          <Button
            fullWidth
            type="button"
            variant="outlined"
            color="success"
            onClick={onCancel}
          >
            {t('loginForm.cancel')}
          </Button>
        </div>
      </form>
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
