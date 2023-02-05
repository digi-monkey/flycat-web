import React from 'react';
import { useTranslation } from 'react-i18next';
import { EventId } from 'service/api';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';

const styles = {
  smallBtn: {
    fontSize: '12px',
    marginLeft: '5px',
    border: 'none' as const,
    background: 'none',
    color: 'gray',
  },
};
export interface BookmarkProps {
  eventId: EventId;
}
export const Bookmark = ({ eventId }: BookmarkProps) => {
  const { t } = useTranslation();
  return (
    <button
      // onClick={() => window.open(`/event/${eventId}`, '_blank')}
      style={styles.smallBtn}
    >
      <BookmarkAddOutlinedIcon style={{ color: 'gray', fontSize: '16px' }} />
    </button>
  );
};
