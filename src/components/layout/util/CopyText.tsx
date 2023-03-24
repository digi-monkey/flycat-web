import React from 'react';
import { generateRandomBytes } from 'service/crypto';

export interface CopyTextProps {
  name: string;
  textToCopy: string;
  successMsg?: string;
}

export const CopyText = ({ name, textToCopy, successMsg }: CopyTextProps) => {
  const randomId = generateRandomBytes(1);
  return (
    <>
      <span
        style={{
          padding: '0px 5px',
          cursor: 'pointer',
        }}
        onClick={() => {
          navigator.clipboard.writeText(textToCopy);
          const msg = document.getElementById(randomId);
          if (msg) {
            msg.style.display = 'block';
            setTimeout(function () {
              msg.style.display = 'none';
            }, 2000);
          }
        }}
      >
        {name}
      </span>
      <div
        id={randomId}
        style={{
          display: 'none',
          background: 'green',
          color: 'white',
          padding: '5px',
          position: 'absolute',
          top: '0',
          right: '0',
        }}
      >
        {successMsg || 'Text copied to clipboard!'}
      </div>
    </>
  );
};
