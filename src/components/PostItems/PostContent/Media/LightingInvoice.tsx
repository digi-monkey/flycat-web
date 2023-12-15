import React, { useEffect, useState } from 'react';
import { decode } from 'core/lighting/bolt11';
import { getParams, LNURLPayParams } from 'js-lnurl';
import { useTranslation } from 'next-i18next';
import { Button } from 'antd';
import Icon from 'components/Icon';

export function LightingInvoice({ url }: { url: string }) {
  const { t } = useTranslation();
  const [decodedData, setDecodedData] = useState<ReturnType<typeof decode>>();
  const [amount, setAmount] = useState<bigint>();

  useEffect(() => {
    try {
      const data = decode(url);
      setDecodedData(data);

      const amount = data.human_readable_part.amount;
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
      onClick={e => e.stopPropagation()}
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
        <Icon type="icon-bolt" />
      </span>
      <span style={{}}>
        <Button onClick={pay}>{t('lighting.pay')}</Button>
      </span>
    </span>
  );
}

export function LnUrlInvoice({ url }: { url: string }) {
  const { t } = useTranslation();
  const [decodedData, setDecodedData] = useState<LNURLPayParams>();
  const [minSendable, setMinSendable] = useState<number>();
  const [maxSendable, setMaxSendable] = useState<number>();
  const [domain, setDomain] = useState<string>();

  const decode = async (url: string) => {
    try {
      const params = (await getParams(url)) as LNURLPayParams;

      if (params.tag !== 'payRequest') {
        return;
      }

      setDecodedData(params);

      setDomain(params.domain);

      if (isNaN(params.minSendable)) {
        return setMinSendable(undefined);
      }
      setMinSendable(params.minSendable / 1000);

      if (isNaN(params.maxSendable)) {
        return setMaxSendable(undefined);
      }
      setMaxSendable(params.maxSendable / 1000);
    } catch (error: any) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    decode(url);
  }, [url]);

  const pay = async () => {
    if (!window.webln) {
      return alert('window.webln is null!');
    }
    console.log('to send');
    await window.webln.enable();
    await window.webln.lnurl(url);
    console.log('send...');
  };

  return (
    <span
      onClick={e => e.stopPropagation()}
      style={{
        padding: '10px',
        width: '300px',
        maxWidth: '100%',
        display: 'block',
        background: 'whitesmoke',
      }}
    >
      <span style={{ display: 'block', margin: '10px 0px' }}>{domain}</span>

      <span style={{ display: 'block', fontSize: '30px', margin: '10px 0px' }}>
        <span style={{ fontSize: '12px' }}>{t('lighting.atLeast')}</span>{' '}
        {minSendable} Sats
        <Icon type="icon-bolt" />
      </span>
      <span style={{}}>
        <Button onClick={pay}>{t('lighting.pay')}</Button>
      </span>
    </span>
  );
}
