import React from 'react';
import { useTranslation } from 'react-i18next';
import { EventId } from 'service/api';

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
      {t('showThread.open')}
    </button>
  );
};
