import { HexStr } from 'types';
import { chainList } from '../../constants/chainList';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@mui/material';
import { getAccount, getNetwork } from '@wagmi/core';

import styles from './index.module.scss';

export enum EvmSignInMode {
  metamask = 'metamask',
  walletConnect = 'wallet-connect',
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, pw?: string) => any;
  mode: EvmSignInMode;
}

export const EvmSignInPopup = ({ isOpen, onClose, onSubmit, mode }: Props) => {
  const { t } = useTranslation();

  const [username, setUsername] = useState('nostr');
  const [password, setPassword] = useState<string | undefined>();

  const [chainId, setChainId] = useState<number | undefined>();
  const [chainName, setChainName] = useState<string | undefined>();
  const [ethAddress, setEthAddress] = useState<string | undefined>();

  const requestChainInfoAndAccount = async () => {
    switch (mode) {
      case EvmSignInMode.metamask:
        {
          if (typeof window.ethereum === 'undefined') return;

          const account = await window.ethereum.request({
            method: 'eth_requestAccounts',
          });
          setEthAddress(account[0]);
          const chainId: HexStr = await window.ethereum.request({
            method: 'eth_chainId',
          });
          setChainId(+chainId);
          const chainName = chainList[(+chainId).toString(10)];
          setChainName(chainName);
        }
        break;

      case EvmSignInMode.walletConnect:
        {
          const ethAddress = getAccount().address;
          setEthAddress(ethAddress);

          const chain = getNetwork().chain;
          setChainId(chain?.id);
          setChainName(chain?.name);
        }

        break;

      default:
        console.debug(`unsupported EvmSignInMode: ${mode}`);
        break;
    }
  };

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleSubmit = () => {
    onSubmit(username, password);
  };

  const shortEthAddress = () => {
    return `${ethAddress?.slice(0, 6)}..${ethAddress?.slice(
      ethAddress.length - 6,
      ethAddress.length,
    )}`;
  };

  useEffect(() => {
    requestChainInfoAndAccount();
  }, []);

  return (
    <Dialog className={styles.popupDialog} open={isOpen} onClose={onClose}>
      <DialogContent>
        <div className={styles.title}>{t('evmSignIn.title')}</div>
        <div className={styles.popupIntroduce}>{t('evmSignIn.introduce')} <a href="/post">{"How evm nostr sub account works"}</a> </div>
        <div className={styles.popupTip}>{t('evmSignIn.tip')}</div>

        <hr />

        <div className={styles.chainInfo}>
          <div>
            <span className={styles.chainInfoLabel}>
              {t('evmSignIn.chainName')}
            </span>{' '}
            <span className={styles.chainInfoValue}>{chainName}</span>
          </div>
          <div>
            <span className={styles.chainInfoLabel}>
              {t('evmSignIn.chainId')}
            </span>{' '}
            <span className={styles.chainInfoValue}>{`(0x${chainId?.toString(
              16,
            )})`}</span>
          </div>
          <div>
            <span className={styles.chainInfoLabel}>
              {t('evmSignIn.address')}
            </span>{' '}
            <span className={styles.chainInfoValue}> {shortEthAddress()}</span>
          </div>
        </div>

        <div className={styles.popupLabel}>{t('evmSignIn.usernameAndPw')}</div>
        <div>
          <input
            className={styles.popupInput}
            type="text"
            placeholder={t('evmSignIn.username')!}
            value={username}
            onChange={handleUsernameChange}
          />
          <input
            className={styles.popupInput}
            type="text"
            placeholder={t('evmSignIn.password')!}
            value={password}
            onChange={handlePasswordChange}
          />
        </div>
        <button className={styles.popupButton} onClick={handleSubmit}>
          {t('evmSignIn.submit')}
        </button>
      </DialogContent>
    </Dialog>
  );
};
