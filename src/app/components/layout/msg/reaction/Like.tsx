import React from 'react';
import { useTranslation } from 'react-i18next';
import { EventId } from 'service/api';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';

const styles = {
  smallBtn: {
    fontSize: '12px',
    marginLeft: '5px',
    border: 'none' as const,
    background: 'none',
    color: 'gray',
  },
};
export interface LikeProps {
  eventId: EventId;
}
export const Like = ({ eventId }: LikeProps) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={() => window.open(`/event/${eventId}`, '_blank')}
      style={styles.smallBtn}
    >
      <ThumbUpOutlinedIcon style={{ color: 'gray', fontSize: '14px' }} />
    </button>
  );
};
