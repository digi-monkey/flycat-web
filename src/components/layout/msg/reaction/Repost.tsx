import React from 'react';
import { useTranslation } from 'next-i18next';
import { EventId } from 'service/api';
import LoopOutlinedIcon from '@mui/icons-material/LoopOutlined';

const styles = {
  smallBtn: {
    fontSize: '12px',
    marginLeft: '5px',
    border: 'none' as const,
    background: 'none',
    color: 'gray',
  },
};
export interface RepostProp {
  eventId: EventId;
}


export const Repost = (Props) => {
  return (
    <button style={styles.smallBtn} {...Props}>
      <LoopOutlinedIcon style={{ color: 'gray', fontSize: '14px' }} />
    </button>
  );
};
