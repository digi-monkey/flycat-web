import React from 'react';
import { connect } from 'react-redux';
import { Nip19DataPrefix, Nip19DataType, nip19Decode } from 'service/api';
import { matchKeyPair } from 'service/crypto';

const LoginForm = ({
  isLoggedIn,
  publicKey,
  privateKey,
  doLogin,
  doLogout,
}) => {
  if (isLoggedIn) {
    return (
      <div>
        <h2> 欢迎光临👏</h2>
        <button onClick={doLogout}>登出</button>
      </div>
    );
  } else {
    return (
      <form
        onSubmit={event => {
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

          doLogin(pubKey, privKey);
        }}
      >
        <label>
          公钥:
          <input type="text" placeholder="必填" name="publicKey" />
          <br />
          私钥:
          <input type="text" placeholder="只读模式可不填" name="privateKey" />
        </label>
        <br />
        <button type="submit">登陆</button>
      </form>
    );
  }
};

const login = (publicKey, privateKey) => ({
  type: 'LOGIN',
  publicKey,
  privateKey,
});

const logout = () => ({
  type: 'LOGOUT',
});

const mapStateToProps = state => ({
  isLoggedIn: state.loginReducer.isLoggedIn,
  publicKey: state.loginReducer.publicKey,
  privateKey: state.loginReducer.privateKey,
});

const mapDispatchToProps = dispatch => ({
  doLogin: (publicKey, privateKey) => dispatch(login(publicKey, privateKey)),
  doLogout: () => dispatch(logout()),
});

export default connect(mapStateToProps, mapDispatchToProps)(LoginForm);
