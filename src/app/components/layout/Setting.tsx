import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Nip19DataType, nip19Encode } from 'service/api';
import { CopyText } from './util/CopyText';

const styles = {
  github: {
    fontSize: '12px',
    color: 'gray',
    display: 'block',
    marginBottom: '10px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '500',
    display: 'block',
    margin: '10px 0px',
  },
};

export interface SettingProps {
  isLoggedIn;
  publicKey;
  privateKey;
  onCancel: () => any;
  version: string;
}

export const Setting = ({
  isLoggedIn,
  publicKey,
  privateKey,
  onCancel,
  version,
}: SettingProps) => {
  const { t } = useTranslation();
  return (
    <>
      <span style={styles.title}>{'Key'}</span>
      {isLoggedIn && (
        <div>
          <CopyText
            name={t('loginForm.pubKey')}
            textToCopy={nip19Encode(publicKey, Nip19DataType.Pubkey)}
            successMsg={'PublicKey copied to clipboard!'}
          />
          <CopyText
            name={t('loginForm.privKey')}
            textToCopy={nip19Encode(privateKey, Nip19DataType.Privkey)}
            successMsg={'PrivateKey copied to clipboard!'}
          />
        </div>
      )}
      {!isLoggedIn && t('UserRequiredLoginBox.loginFirst')}

      <span style={styles.title}>{'About'}</span>
      <span style={styles.github}>
        <p>
          {t('setting.version')} v{version}
        </p>
        Flycat is an open source project:{' '}
        <a
          href="https://github.com/digi-monkey/flycat-web"
          target="_blank"
          rel="noreferrer"
        >
          {t('nav.menu.github')}
        </a>
      </span>
      <button onClick={onCancel}>{t('setting.exit')}</button>
    </>
  );
};

const mapStateToProps = state => ({
  isLoggedIn: state.loginReducer.isLoggedIn,
  publicKey: state.loginReducer.publicKey,
  privateKey: state.loginReducer.privateKey,
});

export default connect(mapStateToProps)(Setting);
