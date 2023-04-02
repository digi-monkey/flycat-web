import { Alert, Snackbar } from '@mui/material';
import { throws } from 'assert';
import React, { useState } from 'react';
import { generateRandomBytes } from 'service/crypto';

export interface CopyTextProps {
  name: string;
  textToCopy?: string;
  getTextToCopy?: () => Promise<string>;
  successMsg?: string;
  alertLastMilsecs?: number;
}

export const CopyText = ({
  name,
  textToCopy,
  getTextToCopy,
  successMsg,
  alertLastMilsecs,
}: CopyTextProps) => {
  const [copySuccessToast, setCopySuccessToast] = useState<boolean>(false);

  const copy = async (text: string) => {
    const inputElement = document.createElement('input');
    inputElement.value = text;
    document.body.appendChild(inputElement);
    inputElement.focus();
    inputElement.select();
    await navigator.clipboard.writeText(text);
    inputElement.remove();
  };

  const copyFallBack = (text: string) => {
    const inputElement = document.createElement('input');
    inputElement.value = text;
    document.body.appendChild(inputElement);
    inputElement.select();
    document.execCommand('copy');
    inputElement.remove();
  };

  return (
    <>
      <span
        style={{
          padding: '0px 5px',
          cursor: 'pointer',
          textTransform: 'capitalize',
        }}
        onClick={async () => {
          if (!textToCopy && !getTextToCopy) {
            return alert(
              'textToCopy and getTextToCopy can not be null at the same time',
            );
          }
          const text =
            textToCopy || (await getTextToCopy?.call(getTextToCopy)) || "";

          try {
            await copy(text);
          } catch (error: any) {
            await copyFallBack(text);
          }
          setCopySuccessToast(true);

          setTimeout(() => {
            setCopySuccessToast(false);
          }, alertLastMilsecs || 5000);
        }}
      >
        {name}
      </span>
      <Snackbar
        open={copySuccessToast}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        autoHideDuration={4000}
        onClose={() => setCopySuccessToast(false)}
      >
        <Alert severity="success">
          {successMsg || 'Text copied to clipboard!'}
        </Alert>
      </Snackbar>
    </>
  );
};
