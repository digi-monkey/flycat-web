import React from 'react';
import { useTranslation } from 'react-i18next';
import { EventId } from 'service/api';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

const styles = {
  smallBtn: {
    fontSize: '12px',
    marginLeft: '5px',
    border: 'none' as const,
  },
};
export interface DeleteProps {
  eventId: EventId;
}
export const Delete = ({ eventId }: DeleteProps) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={() => window.open(`/event/${eventId}`, '_blank')}
      style={styles.smallBtn}
    >
      <DeleteOutlinedIcon style={{ color: 'gray', fontSize: '14px' }} />
    </button>
  );
};
