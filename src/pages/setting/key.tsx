import { useVersion } from 'hooks/useVersion';
import { useTranslation } from 'react-i18next';
import { Button, Divider, Input, List } from 'antd';
import { connect } from 'react-redux';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';

import styles from './index.module.scss';
import { CopyText } from 'components/CopyText/CopyText';
import { Nip19, Nip19DataType } from 'core/nip/19';
import { LoginMode } from 'store/loginReducer';
import { getPrivateKeyFromMetamaskSignIn } from 'core/evm/metamask';
import { getPrivateKeyFromWalletConnectSignIn } from 'core/evm/walletConnect';
import Link from 'next/link';

function Key({ mode, isLoggedIn, privateKey, evmUsername }) {
  const { t } = useTranslation();
  const myPublicKey = useReadonlyMyPublicKey();

  const copyPrivateKey =
    mode === LoginMode.metamask || mode === LoginMode.walletConnect
      ? {
          label: <Input disabled type="password" value={'to be request'} />,
          action: (
            <CopyText
              name={'copy'}
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
                  const privKey =
                    await getPrivateKeyFromMetamaskSignIn(evmUsername);
                  if (privKey == null) throw new Error('unable to get privKey');
                  return Nip19.encode(privKey, Nip19DataType.Nprivkey);
                } else {
                  const privKey =
                    await getPrivateKeyFromWalletConnectSignIn(evmUsername);
                  if (privKey == null) throw new Error('unable to get privKey');
                  return Nip19.encode(privKey, Nip19DataType.Nprivkey);
                }
              }}
            />
          ),
        }
      : mode === LoginMode.local
        ? {
            label: <Input disabled type="password" value={privateKey} />,
            action: (
              <CopyText
                name={'copy'}
                textToCopy={Nip19.encode(privateKey, Nip19DataType.Nprivkey)}
              />
            ),
          }
        : {
            label: 'no private key access since you are sign-in with extension',
            action: null,
          };

  const copyHexPrivateKey =
    mode === LoginMode.metamask || mode === LoginMode.walletConnect
      ? {
          label: <Input disabled type="password" value={'to be request'} />,
          action: (
            <CopyText
              name={'copy'}
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
                  const privKey =
                    await getPrivateKeyFromMetamaskSignIn(evmUsername);
                  if (privKey == null) throw new Error('unable to get privKey');
                  return Nip19.encode(privKey, Nip19DataType.Nprivkey);
                } else {
                  const privKey =
                    await getPrivateKeyFromWalletConnectSignIn(evmUsername);
                  if (privKey == null) throw new Error('unable to get privKey');

                  return privKey;
                }
              }}
            />
          ),
        }
      : mode === LoginMode.local
        ? {
            label: <Input disabled type="password" value={privateKey} />,
            action: <CopyText name={'copy'} textToCopy={privateKey} />,
          }
        : {
            label: 'no private key access since you are sign-in with extension',
            action: null,
          };

  return (
    <>
      <List size="large">
        <List.Item
          actions={[
            <CopyText
              key={'copy-public-key'}
              name={'copy'}
              textToCopy={Nip19.encode(myPublicKey, Nip19DataType.Npubkey)}
            />,
          ]}
        >
          <List.Item.Meta
            title="Public Key"
            description={Nip19.encode(myPublicKey, Nip19DataType.Npubkey)}
          />
        </List.Item>

        <List.Item
          actions={[
            <CopyText
              key={'copy-raw-key'}
              name={'copy'}
              textToCopy={myPublicKey}
            />,
          ]}
        >
          <List.Item.Meta title="Hex Public Key" description={myPublicKey} />
        </List.Item>

        <List.Item actions={[copyPrivateKey.action]}>
          <List.Item.Meta
            title="Private Key"
            description={copyPrivateKey.label}
          />
        </List.Item>

        <List.Item actions={[copyHexPrivateKey.action]}>
          <List.Item.Meta
            title="Hex Private Key"
            description={copyHexPrivateKey.label}
          />
        </List.Item>
      </List>
      <Divider></Divider>
      <Button
        onClick={() => window.open('https://usenostr.org/', 'blank')}
        type="link"
      >
        What is nostr key?
      </Button>
    </>
  );
}

const mapStateToProps = state => ({
  isLoggedIn: state.loginReducer.isLoggedIn,
  mode: state.loginReducer.mode,
  evmUsername: state.loginReducer.evmUsername,
  publicKey: state.loginReducer.publicKey,
  privateKey: state.loginReducer.privateKey,
});

export default connect(mapStateToProps)(Key);
