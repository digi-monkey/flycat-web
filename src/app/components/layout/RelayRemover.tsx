import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { REMOVE_URL_FROM_PUBLIC_KEY } from '../../../store/relayReducer';
import { Clear } from '@mui/icons-material';

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
    <span>
      &nbsp;
      <button
        type="button"
        onClick={handleRemove}
        style={{
          border: 'none',
          background: 'none',
          fontSize: '8px',
          color: 'gray',
        }}
      >
        <Clear fontSize="small" />
      </button>
    </span>
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
