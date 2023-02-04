import React from 'react';
import { useTranslation } from 'react-i18next';
import { EventId } from 'service/api';
import MenuOpenOutlinedIcon from '@mui/icons-material/MenuOpenOutlined';

const styles = {
  smallBtn: {
    fontSize: '12px',
    marginLeft: '5px',
    border: 'none' as const,
  },
};
export interface ShowThreadProps {
  eventId: EventId;
}
export const ShowThread = ({ eventId }: ShowThreadProps) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={() => window.open(`/event/${eventId}`, '_blank')}
      style={styles.smallBtn}
    >
      <MenuOpenOutlinedIcon style={{ color: 'gray', fontSize: '16px' }} />{' '}
      {t('showThread.open')}
    </button>
  );
};
