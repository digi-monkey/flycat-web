import React from 'react';
import { Button } from '@getalby/bitcoin-connect-react';

interface BitcoinButtonProps {
  isDisabled: boolean;
}

const BitcoinButton: React.FC<BitcoinButtonProps> = ({ isDisabled }) => {
  const handleConnect = () => {
     
         
    
  };

  return (
    <div className="bitcoin-connect-container">
      
        <Button onConnect={handleConnect} />
      
    </div>
  );
};

export default BitcoinButton;
