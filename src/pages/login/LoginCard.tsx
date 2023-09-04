import { connect } from 'react-redux';
import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { walletConnector } from 'core/evm/wagmi/connectors';
import { isWalletConnected } from 'core/evm/wagmi/helper';
import { connect as wagmiConnect } from '@wagmi/core';
import { getPublicKey, randomKeyPair } from 'core/crypto';
import { EvmSignInMode, EvmSignInPopup } from './Popup';
import { login, LoginMode, LoginRequest } from 'store/loginReducer';
import { isNip05DomainName } from 'core/nip/05';
import { Nip19DataType, Nip19DataPrefix, Nip19 } from 'core/nip/19';
import { isDotBitName } from 'core/dotbit';
import { Button, Divider, Input, message } from 'antd';

import styles from './index.module.scss';
import PageTitle from 'components/PageTitle';
import { Paths } from 'constants/path';

export interface LoginFormProps {
  isLoggedIn;
  mode;
  evmUsername;
  doLogin;
  doLogout;
}

const LoginCard = ({ isLoggedIn, doLogin }: LoginFormProps) => {
  const { t } = useTranslation();

  const [privKeyInputValue, setPrivKeyInputValue] = useState<string>('');
  const [createdNewPublicKey, setCreatedNewPublicKey] = useState<string>();
  const [readonlyInputValue, setReadonlyInputValue] = useState<string>('');

  const [messageApi, contextHolder] = message.useMessage();

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
      messageApi.error(
        'window.nostr not found! did you install the Nip07 wallet extension?',
        3,
      );
      return;
    }

    const loginRequest: LoginRequest = {
      mode: LoginMode.nip07Wallet,
    };
    doLogin(loginRequest);
  };

  const signWithJoyId = async () => {
    const loginRequest: LoginRequest = {
      mode: LoginMode.joyId,
    };
    doLogin(loginRequest);
  };

  const signWithEthWallet = async () => setShowMetamaskSignInPopup(true);

  const signWithWalletConnect = async () => {
    if (!isWalletConnected()) {
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
      messageApi.error('typeof pubKey !== "string"', 3);
      return;
    }

    if (pubKey.startsWith(Nip19DataPrefix.Npubkey)) {
      const res = Nip19.decode(pubKey);
      if (res.type !== Nip19DataType.Npubkey) {
        messageApi.error('bech32 encoded publickey decoded err', 3);
        return;
      }
      pubKey = res.data;
    }

    if (pubKey.length !== 64) {
      messageApi.error(
        'only support 32 bytes hex publicKey now, wrong length',
        3,
      );
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

    if (privKey.startsWith(Nip19DataPrefix.Nprivkey)) {
      const res = Nip19.decode(privKey);
      if (res.type !== Nip19DataType.Nprivkey) {
        messageApi.error('bech32 encoded privkey decoded err', 3);
        return;
      }
      privKey = res.data;
    }

    if (privKey.length !== 64) {
      messageApi.error(
        'only support 32 bytes hex private key now, wrong length',
        3,
      );
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
      messageApi.error(
        'window.ethereum not found! did you install the metamask?',
        3,
      );
      return;
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

  const notLoggedInUI = (
    <div>
      {contextHolder}
      <PageTitle title={isLoggedIn ? 'Sign Out' : 'Sign In'} />
      <div className={styles.signPanel}>
        <Button className={styles.button} onClick={signWithNip07Wallet}>
          <img className={styles.icon} src="./icon/Alby-logo-figure-400.svg" />
          {t('loginForm.signWithNip07')}
        </Button>

        <Button className={styles.button} onClick={signWithJoyId}>
          <img className={styles.icon} style={{transform: "scale(2)"}} src="./icon/joyid-logo.svg" />
          {'JoyId'}
        </Button>

        <Button className={styles.button} onClick={signWithEthWallet}>
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

        <Button className={styles.button} onClick={signWithWalletConnect}>
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

        <Divider orientation="left">{t('loginForm.readonlyMode')}</Divider>

        <div className={styles.inputWithSubmitButton}>
          <Input
            type="text"
            placeholder={'publicKey/nip05DomainName/.bit'}
            name="dotbitDomainName"
            bordered={false}
            value={readonlyInputValue}
            onChange={event => setReadonlyInputValue(event.target.value)}
          />
          <Button type="link" onClick={signWithReadonly}>
            {t('loginForm.signIn')}
          </Button>
        </div>

        <Divider orientation="left">
          <a
            className={styles.discourageLinkBtn}
            href="#"
            onClick={() => setShowPrivateKeyInput(prev => !prev)}
          >
            {t('loginForm.signInWithPrivKeyTitle')} {'(dangerous)'} {'-->'}
          </a>
        </Divider>

        <div></div>

        {showPrivateKeyInput && (
          <div className={styles.buttonBox}>
            {createdNewPublicKey && (
              <small>{t('loginForm.backUpPrivKeyHint')}</small>
            )}
            <div className={styles.inputWithSubmitButton}>
              <Input
                type="text"
                placeholder={t('loginForm.privKey') || ''}
                name="privateKey"
                bordered={false}
                className={`${styles.input}`}
                value={privKeyInputValue}
                onChange={event => setPrivKeyInputValue(event.target.value)}
              />
              <Button onClick={signWithPrivateKey} type="link">
                {t('loginForm.signIn')}
              </Button>
            </div>

            <div>
              <Button type="link" onClick={genNewKeyPair}>
                {t('loginForm.genNewKey')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const alreadyLoggedIn = (
    <div className={styles.signPanel}>
      {contextHolder}you are already sign-in!
    </div>
  );

  return isLoggedIn ? alreadyLoggedIn : notLoggedInUI;
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
  doLogin: (request: LoginRequest) =>
    dispatch(login(request))
      .then(() => (window.location.href = Paths.home))
      .catch(error => {
        message.error(error.message, 5);
      }),
  doLogout: () => dispatch(logout()),
});

export default connect(mapStateToProps, mapDispatchToProps)(LoginCard);
