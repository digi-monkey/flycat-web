import { ThinHr } from '../../components/layout/ThinHr';
import { Button } from '@mui/material';
import { connect } from 'react-redux';
import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { walletConnector } from 'service/evm/wagmi/connectors';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { getPublicKey, randomKeyPair } from 'service/crypto';
import { EvmSignInMode, EvmSignInPopup } from './Popup';
import { login, LoginMode, LoginRequest } from 'store/loginReducer';
import { isDotBitName, isNip05DomainName } from 'service/helper';
import { connect as wagmiConnect } from '@wagmi/core';
import {
  Nip19DataPrefix,
  Nip19DataType,
  nip19Decode,
  nip19Encode,
} from 'service/api';
import { getPrivateKeyFromMetamaskSignIn } from '../../service/evm/metamask';
import { getPrivateKeyFromWalletConnectSignIn } from '../../service/evm/walletConnect';

import { CopyText } from 'components/CopyText/CopyText';
import { isWalletConnected } from 'service/evm/wagmi/helper';

import styles from './index.module.scss';

export interface LoginFormProps {
  isLoggedIn;
  mode;
  evmUsername;
  doLogin;
  doLogout;
}

const LoginCard = ({
  isLoggedIn,
  mode,
  evmUsername,
  doLogin,
  doLogout,
}: LoginFormProps) => {
  const { t } = useTranslation();
  const myPublicKey = useReadonlyMyPublicKey();

  const [privKeyInputValue, setPrivKeyInputValue] = useState<string>('');
  const [createdNewPublicKey, setCreatedNewPublicKey] = useState<string>();
  const [readonlyInputValue, setReadonlyInputValue] = useState<string>('');

  const [showPrivateKeyInput, setShowPrivateKeyInput] =
    useState<boolean>(false);
  const [showMetamaskSignInPopup, setShowMetamaskSignInPopup] =
    useState<boolean>(false);
  const [showWalletSignInPopup, setShowWalletSignInPopup] =
    useState<boolean>(false);

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

  const signWithEthWallet = async () => {
    setShowMetamaskSignInPopup(true);
  };

  const signWithWalletConnect = async () => {
    if(!isWalletConnected()){
      await wagmiConnect({
        connector: walletConnector,
      });
    }

    setShowWalletSignInPopup(true);
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

    const pubKey = getPublicKey(privKey);
    const loginRequest: LoginRequest = {
      mode: LoginMode.local,
      publicKey: pubKey,
      privateKey: privKey,
    };
    doLogin(loginRequest);
  };

  const onMetamaskSignInSubmit = (username, password) => {
    if (typeof window.ethereum === 'undefined') {
      return alert('window.ethereum not found! did you install the metamask?');
    }

    const loginRequest: LoginRequest = {
      mode: LoginMode.metamask,
      evmUsername: username,
      evmPassword: password,
    };
    doLogin(loginRequest);
    setShowMetamaskSignInPopup(false);
  };

  const onWalletConnectSignInSubmit = (username, password) => {
    const loginRequest: LoginRequest = {
      mode: LoginMode.walletConnect,
      evmUsername: username,
      evmPassword: password,
    };
    doLogin(loginRequest);
    setShowWalletSignInPopup(false);
  };

  const genNewKeyPair = () => {
    const data = randomKeyPair();
    setCreatedNewPublicKey(data.pubKey);
    setPrivKeyInputValue(data.privKey);
  };

  const LoggedInUI = (
    <div>
      <div className={styles.title}>{t('loginForm.welcome')}</div>
      <div className={styles.line}>{t('loginForm.signedInFrom')} {mode}</div>
      <div className={styles.line}>
        {myPublicKey && (
          <CopyText
            name={t('loginForm.copyPubKey')}
            textToCopy={nip19Encode(myPublicKey, Nip19DataType.Pubkey)}
          />
        )}
      </div>
      <div className={styles.line}>
        {(mode === LoginMode.metamask || mode === LoginMode.walletConnect) && (
          <CopyText
            name={t('loginForm.copyPrivKey')}
            getTextToCopy={async () => {
              if (evmUsername == null) {
                // todo: how do we use custom ux instead of window.prompt to get user input here?
                evmUsername =
                  window.prompt('Your Evm sign-in username: ', 'nostr') ||
                  undefined;
                if (evmUsername == null) {
                  const errMsg =
                    "Evm sign-in username not found, can't generate public key";
                  alert(errMsg);
                  throw new Error(errMsg);
                }
              }

              if (mode === LoginMode.metamask) {
                const privKey = await getPrivateKeyFromMetamaskSignIn(
                  evmUsername,
                );
                if (privKey == null) throw new Error('unable to get privKey');
                return nip19Encode(privKey, Nip19DataType.Privkey);
              } else {
                const privKey = await getPrivateKeyFromWalletConnectSignIn(
                  evmUsername,
                );
                if (privKey == null) throw new Error('unable to get privKey');
                return nip19Encode(privKey, Nip19DataType.Privkey);
              }
            }}
          />
        )}
      </div>
      <div className={styles.buttonBox}>
        <Button
          variant="contained"
          onClick={doLogout}
          className={`${styles.button}`}
        >
          {t('loginForm.signOut')}
        </Button>
      </div>
    </div>
  );

  const notLoggedInUI = (
    <div>
      <div className={styles.loginArea}>
        <div className={styles.title}>{t('loginForm.title')}</div>
        <div className={styles.buttonBox}>
          <Button
            className={`${styles.button} ${styles.alby}`}
            variant="contained"
            onClick={signWithNip07Wallet}
          >
            <img
              className={styles.icon}
              src="./icon/Alby-logo-figure-400.svg"
            />
            {t('loginForm.signWithNip07')}
          </Button>
        </div>

        <div className={styles.buttonBox}>
          <Button
            className={`${styles.button} ${styles.metamask}`}
            variant="contained"
            onClick={signWithEthWallet}
          >
            <img className={styles.icon} src="./icon/metamask-fox.svg" />
            {t('loginForm.signWithMetamask')}
          </Button>
          {showMetamaskSignInPopup && (
            <EvmSignInPopup
              isOpen={showMetamaskSignInPopup}
              onClose={() => setShowMetamaskSignInPopup(false)}
              mode={EvmSignInMode.metamask}
              onSubmit={onMetamaskSignInSubmit}
            />
          )}
        </div>

        <div className={styles.buttonBox}>
          <Button
            className={`${styles.button} ${styles.walletConnect}`}
            variant="contained"
            onClick={signWithWalletConnect}
          >
            <img className={styles.icon} src="./icon/wallet-connect-logo.svg" />
            {t('loginForm.signWithWalletConnect')}
          </Button>
          {showWalletSignInPopup && (
            <EvmSignInPopup
              isOpen={showWalletSignInPopup}
              onClose={() => setShowWalletSignInPopup(false)}
              mode={EvmSignInMode.walletConnect}
              onSubmit={onWalletConnectSignInSubmit}
            />
          )}
        </div>
      </div>

      <ThinHr />

      <div className={styles.buttonBox}>
        <div className={styles.readonlyModeTitle}>
          {t('loginForm.readonlyMode')}
        </div>
        <div className={styles.inputWithSubmitButton}>
          <input
            type="text"
            placeholder={'publicKey/nip05DomainName/.bit'}
            name="dotbitDomainName"
            className={`${styles.input} ${styles.noframe}`}
            value={readonlyInputValue}
            onChange={event => setReadonlyInputValue(event.target.value)}
          />
          <button
            className={`${styles.submitButton}`}
            onClick={signWithReadonly}
          >
            {t('loginForm.signIn')}
          </button>
        </div>
      </div>

      <ThinHr />
      <div className={styles.buttonBox}>
        <a href="#" onClick={() => setShowPrivateKeyInput(prev => !prev)}>
          {t('loginForm.signInWithPrivKeyTitle')} {'(dangerous)'} {'-->'}
        </a>
      </div>

      {showPrivateKeyInput && (
        <div className={styles.buttonBox}>
          {createdNewPublicKey && (
            <small>{t('loginForm.backUpPrivKeyHint')}</small>
          )}
          <div className={styles.inputWithSubmitButton}>
            <input
              type="text"
              placeholder={t('loginForm.privKey') || ''}
              name="privateKey"
              className={`${styles.input} ${styles.noframe}`}
              value={privKeyInputValue}
              onChange={event => setPrivKeyInputValue(event.target.value)}
            />
            <button
              onClick={signWithPrivateKey}
              className={`${styles.submitButton}`}
            >
              {t('loginForm.signIn')}
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={genNewKeyPair}
              style={{
                border: 'none',
                background: 'none',
              }}
            >
              {t('loginForm.genNewKey')}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return isLoggedIn ? LoggedInUI : notLoggedInUI;
};

const logout = () => ({
  type: 'LOGOUT',
});

const mapStateToProps = state => ({
  isLoggedIn: state.loginReducer.isLoggedIn,
  mode: state.loginReducer.mode,
  evmUsername: state.loginReducer.evmUsername,
  publicKey: state.loginReducer.publicKey,
  privateKey: state.loginReducer.privateKey,
});

const mapDispatchToProps = dispatch => ({
  doLogin: (request: LoginRequest) => dispatch(login(request)),
  doLogout: () => dispatch(logout()),
});

export default connect(mapStateToProps, mapDispatchToProps)(LoginCard);
