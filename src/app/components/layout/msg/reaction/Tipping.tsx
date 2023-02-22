import React from 'react';
import { useTranslation } from 'react-i18next';
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

const Icon = styled.span`
  color: gray;
  cursor: pointer;
  :hover {
    color: yellow;
    border-radius: 50%;
    background: #d1bdbd;
  }
`;
export const Tipping = ({ address }: TippingProps) => {
  const { t } = useTranslation();
  const pay = async () => {
    await payLnUrlInWebLn(address);
  };

  return (
    <button onClick={pay} style={styles.smallBtn}>
      <Icon>
        <ElectricBoltOutlinedIcon style={{ fontSize: '14px' }} />
      </Icon>
    </button>
  );
};
