import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { isValidWssUrl } from 'service/helper';
import {
  ADD_URL_TO_PUBLIC_KEY,
  REMOVE_URL_FROM_PUBLIC_KEY,
} from '../../../store/relayReducer';

interface Props {
  url: string;
  publicKey: string;
  rmUrlToPublicKey: (publicKey: string, url: string) => void;
}

const RelayRemover: React.FC<Props> = ({
  url,
  publicKey,
  rmUrlToPublicKey,
}) => {
  const { t } = useTranslation();

  const handleRemove = () => {
    console.log('remove');
    rmUrlToPublicKey(publicKey, url);
  };

  return (
    <>
      &nbsp;
      <button
        type="button"
        onClick={handleRemove}
        style={{
          color: 'red',
          border: 'none',
          background: 'none',
          fontSize: '10px',
        }}
      >
        {'-'}
      </button>
    </>
  );
};

const mapStateToProps = state => ({
  relay: state.relay,
});

const mapDispatchToProps = dispatch => ({
  rmUrlToPublicKey: (publicKey: string, url: string) =>
    dispatch({
      type: REMOVE_URL_FROM_PUBLIC_KEY,
      payload: { publicKey, url },
    }),
});

export default connect(mapStateToProps, mapDispatchToProps)(RelayRemover);
