import { Button } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { decode } from 'service/lighting/bolt11';
import ElectricBoltOutlinedIcon from '@mui/icons-material/ElectricBoltOutlined';

export function LightingInvoice({ url }: { url: string }) {
  const [decodedData, setDecodedData] = useState<ReturnType<typeof decode>>();
  const [amount, setAmount] = useState<bigint>();

  useEffect(() => {
    try {
      const data = decode(url);
      setDecodedData(data);

      let amount = data.human_readable_part.amount;
      //@ts-ignore
      if (isNaN(amount)) {
        return setAmount(undefined);
      }
      setAmount(BigInt(amount) / BigInt(1000));
    } catch (error: any) {
      console.log(error.message);
    }
  }, [url]);

  const pay = async () => {
    if (!window.webln) {
      return alert('window.webln is null!');
    }
    await window.webln.enable();
    await window.webln.sendPayment(url);
  };

  return (
    <span
      style={{
        padding: '10px',
        width: '300px',
        maxWidth: '100%',
        display: 'block',
        background: 'whitesmoke',
      }}
    >
      <span style={{ display: 'block', margin: '10px 0px' }}>
        {decodedData?.data.tags
          .filter(t => t.description === 'description')
          .map(t => t.value)}
      </span>

      <span style={{ display: 'block', fontSize: '30px', margin: '10px 0px' }}>
        {amount?.toString()} sats
        <ElectricBoltOutlinedIcon color="warning" />
      </span>
      <span style={{}}>
        <Button fullWidth variant="outlined" color="success" onClick={pay}>
          pay
        </Button>
      </span>
    </span>
  );
}
