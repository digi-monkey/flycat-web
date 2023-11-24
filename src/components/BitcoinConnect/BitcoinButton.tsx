import React from 'react';
import { Button } from '@getalby/bitcoin-connect-react';

interface BitcoinButtonProps {
  isDisabled: boolean;
}

const BitcoinButton: React.FC<BitcoinButtonProps> = ({ isDisabled }) => {
  const handleConnect = () => {
    if (!isDisabled) {
      alert('Connected!');
     
    }
  };

  return (
    <div className="bitcoin-connect-container">
      <div style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
        <Button onConnect={handleConnect} />
      </div>
    </div>
  );
};

export default BitcoinButton;
