import React from 'react';
import { Button } from '@getalby/bitcoin-connect-react';

interface BitcoinButtonProps {}

const BitcoinButton: React.FC<BitcoinButtonProps> = () => {
  const handleConnect = () => {
    
  };

  return (
    <div className="bitcoin-connect-container">
      <Button onConnect={handleConnect} />
    </div>
  );
};

export default BitcoinButton;

