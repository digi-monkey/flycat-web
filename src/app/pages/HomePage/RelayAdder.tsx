import React, { useState } from 'react';
import { connect } from 'react-redux';
import { isValidWssUrl } from 'service/helper';
import { ADD_URL_TO_PUBLIC_KEY } from '../../../store/relayReducer';

interface Props {
  publicKey: string;
  addUrlToPublicKey: (publicKey: string, url: string) => void;
}

const RelayAdder: React.FC<Props> = ({ publicKey, addUrlToPublicKey }) => {
  const [url, setUrl] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let wsUrl = url.trim();

    if (!isValidWssUrl(wsUrl)) {
      return alert('invalid wss url!');
    }

    if (!wsUrl.endsWith('/')) {
      wsUrl = wsUrl + '/';
    }

    addUrlToPublicKey(publicKey, wsUrl);
    setUrl('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="url">
        <input
          type="text"
          placeholder="wss://"
          id="url"
          value={url}
          onChange={handleChange}
        />
      </label>
      &nbsp;<button type="submit">添加</button>
    </form>
  );
};

const mapStateToProps = state => ({
  relay: state.relay,
});

const mapDispatchToProps = dispatch => ({
  addUrlToPublicKey: (publicKey: string, url: string) =>
    dispatch({
      type: ADD_URL_TO_PUBLIC_KEY,
      payload: { publicKey, url },
    }),
});

export default connect(mapStateToProps, mapDispatchToProps)(RelayAdder);
