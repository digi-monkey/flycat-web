import React from 'react';
import { useTranslation } from 'next-i18next';
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
export const Bookmark = (Props) => {
  return (
    <button style={styles.smallBtn} {...Props}>
      <BookmarkAddOutlinedIcon style={{ color: 'gray', fontSize: '16px' }} />
    </button>
  );
};
