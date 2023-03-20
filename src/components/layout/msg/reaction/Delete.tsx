import React from 'react';
import { useTranslation } from 'next-i18next';
import { EventId } from 'service/api';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

const styles = {
  smallBtn: {
    fontSize: '12px',
    marginLeft: '5px',
    border: 'none' as const,
    background: 'none',
    color: 'gray',
  },
};
export interface DeleteProps {
  eventId: EventId;
}
export const Delete = ({ eventId }: DeleteProps) => {
  const { t } = useTranslation();
  return (
    <button
      style={styles.smallBtn}
    >
      <DeleteOutlinedIcon style={{ color: 'gray', fontSize: '14px' }} />
    </button>
  );
};
