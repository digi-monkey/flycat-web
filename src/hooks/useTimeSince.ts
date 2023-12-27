import { useMemo } from 'react';
import { useTranslation } from 'next-i18next';

export function useTimeSince(timestamp: number): string {
  const { t } = useTranslation();

  const timeSince = useMemo(() => {
    const currentTime = Date.now() / 1000;
    const timeDifference = Math.max(currentTime - timestamp, 0);

    if (timeDifference === 0) {
      return t('timeSince.now') as string;
    }

    if (timeDifference < 60) {
      return `${Math.floor(timeDifference)} ${t('timeSince.seconds')}`;
    }
    if (timeDifference < 3600) {
      return `${Math.floor(timeDifference / 60)} ${t('timeSince.minutes')}`;
    }
    if (timeDifference < 86400) {
      return `${Math.floor(timeDifference / 3600)} ${t('timeSince.hours')}`;
    }
    if (timeDifference < 2592000) {
      return `${Math.floor(timeDifference / 86400)} ${t('timeSince.days')}`;
    }
    return `${Math.floor(timeDifference / 2592000)} ${t('timeSince.month')}`;
  }, [timestamp, t]);

  return timeSince;
}
