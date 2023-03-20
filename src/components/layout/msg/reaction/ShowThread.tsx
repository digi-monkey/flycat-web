import { Paths } from 'constants/path';
import { EventId } from 'service/api';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

import MenuOpenOutlinedIcon from '@mui/icons-material/MenuOpenOutlined';

const styles = {
  smallBtn: {
    fontSize: '12px',
    marginLeft: '5px',
    border: 'none' as const,
    background: 'none',
    color: 'gray',
  },
};
export interface ShowThreadProps {
  eventId: EventId;
}
export const ShowThread = ({ eventId }: ShowThreadProps) => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <button
      onClick={() => router.push({ pathname: `${Paths.event}/${eventId}` })}
      style={styles.smallBtn}
    >
      <MenuOpenOutlinedIcon style={{ color: 'gray', fontSize: '16px' }} />{' '}
      {t('showThread.open')}
    </button>
  );
};
