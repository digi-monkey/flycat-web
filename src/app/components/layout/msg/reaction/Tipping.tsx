import React from 'react';
import { useTranslation } from 'react-i18next';
import { EventId } from 'service/api';
import ElectricBoltOutlinedIcon from '@mui/icons-material/ElectricBoltOutlined';

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
  eventId: EventId;
}
export const Tipping = ({ eventId }: TippingProps) => {
  const { t } = useTranslation();
  return (
    <button
      //onClick={() => window.open(`/event/${eventId}`, '_blank')}
      style={styles.smallBtn}
    >
      <ElectricBoltOutlinedIcon style={{ color: 'gray', fontSize: '14px' }} />
    </button>
  );
};
