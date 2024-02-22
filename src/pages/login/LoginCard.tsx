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
import styles from './index.module.scss';
import PageTitle from 'components/PageTitle';
import { Paths } from 'constants/path';
import { useToast } from 'components/shared/ui/Toast/use-toast';
import { Button } from 'components/shared/ui/Button';
import { Input } from 'components/shared/ui/Input';

export interface LoginFormProps {
  isLoggedIn;
  mode;
  evmUsername;
  doLogin;
  doLogout;
}

const LoginCard = ({ isLoggedIn, doLogin }: LoginFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
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
      toast({
        title:
          'window.nostr not found! did you install the Nip07 wallet extension?',
        status: 'error',
      });
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
    if (!(await isWalletConnected())) {
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
      toast({ title: 'typeof pubKey !== "string"', status: 'error' });
      return;
    }

    if (pubKey.startsWith(Nip19DataPrefix.Npubkey)) {
      const res = Nip19.decode(pubKey);
      if (res.type !== Nip19DataType.Npubkey) {
        toast({
          title: 'bech32 encoded publickey decoded err',
          status: 'error',
        });
        return;
      }
      pubKey = res.data;
    }

    if (pubKey.length !== 64) {
      toast({
        title: 'only support 32 bytes hex publicKey now, wrong length',
        status: 'error',
      });
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
        toast({ title: 'bech32 encoded privkey decoded err', status: 'error' });
        return;
      }
      privKey = res.data;
    }

    if (privKey.length !== 64) {
      toast({
        title: 'only support 32 bytes hex private key now, wrong length',
        status: 'error',
      });
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
      toast({
        title: 'window.ethereum not found! did you install the metamask?',
        status: 'error',
      });
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
      <PageTitle title={isLoggedIn ? 'Sign Out' : 'Sign In'} />
      <div className={styles.signPanel}>
        <Button
          className={styles.button}
          variant={'secondary'}
          onClick={signWithNip07Wallet}
        >
          <img className={styles.icon} src="./icon/Alby-logo-figure-400.svg" />
          {t('loginForm.signWithNip07')}
        </Button>

        <Button
          className={styles.button}
          variant={'secondary'}
          onClick={signWithJoyId}
        >
          <img className={styles.icon} src="./icon/joyid-passkey.png" />
          {process.env.NODE_ENV === 'production' ? '(Mainnet)' : '(Testnet)'}
        </Button>

        <Button
          className={styles.button}
          variant={'secondary'}
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

        <Button
          className={styles.button}
          variant={'secondary'}
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

        <h4>{t('loginForm.readonlyMode')}</h4>

        <div className={styles.inputWithSubmitButton}>
          <Input
            className="border-0 bg-transparent"
            placeholder={'publicKey/nip05DomainName/.bit'}
            name="dotbitDomainName"
            value={readonlyInputValue}
            onChange={event => setReadonlyInputValue(event.currentTarget.value)}
          />
          <Button variant="link" onClick={signWithReadonly}>
            {t('loginForm.signIn')}
          </Button>
        </div>

        <div>
          <Button
            className="px-0 m-2 text-neutral-700"
            variant={'link'}
            onClick={() => setShowPrivateKeyInput(prev => !prev)}
          >
            {t('loginForm.signInWithPrivKeyTitle')} {'(dangerous)'} {'-->'}
          </Button>
        </div>

        <div></div>

        {showPrivateKeyInput && (
          <div className={styles.buttonBox}>
            {createdNewPublicKey && (
              <small>{t('loginForm.backUpPrivKeyHint')}</small>
            )}
            <div className={styles.inputWithSubmitButton}>
              <Input
                placeholder={t('loginForm.privKey') || ''}
                name="privateKey"
                className={`${styles.input} border-0 bg-transparent`}
                value={privKeyInputValue}
                onChange={event =>
                  setPrivKeyInputValue(event.currentTarget.value)
                }
              />
              <Button onClick={signWithPrivateKey} variant="link">
                {t('loginForm.signIn')}
              </Button>
            </div>

            <div>
              <Button
                className="m-0 p-0"
                variant="link"
                onClick={genNewKeyPair}
              >
                {t('loginForm.genNewKey')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const alreadyLoggedIn = (
    <div className={styles.signPanel}>you are already sign-in!</div>
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
        alert(error.message);
      }),
  doLogout: () => dispatch(logout()),
});

export default connect(mapStateToProps, mapDispatchToProps)(LoginCard);
