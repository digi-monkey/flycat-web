import React from 'react';
import { useTranslation } from 'next-i18next';
import ElectricBoltOutlinedIcon from '@mui/icons-material/ElectricBoltOutlined';
import { payLnUrlInWebLn } from 'service/lighting/lighting';
import styled from 'styled-components';

const styles = {
  smallBtn: {
    fontSize: '12px',
    //marginLeft: '5px',
    border: 'none' as const,
    background: 'none',
    color: 'gray',
  },
};
export interface TippingProps {
  address: string;
}

export const Tipping = ({ address }: TippingProps) => {
  const pay = async () => await payLnUrlInWebLn(address);

  return (
    <button onClick={pay} style={styles.smallBtn}>
      <span>
        <ElectricBoltOutlinedIcon style={{ fontSize: '14px' }} />
      </span>
    </button>
  );
};
