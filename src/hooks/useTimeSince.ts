import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function useTimeSince(timestamp: number): string {
  const { t } = useTranslation();
  const [timeSince, setTimeSince] = useState<string>('');

  useEffect(() => {
    const currentTime = Date.now() / 1000;
    const timeDifference = currentTime - timestamp;

    if (timeDifference < 60) {
      setTimeSince(`${Math.floor(timeDifference)} ${t('timeSince.seconds')}`);
    } else if (timeDifference < 3600) {
      setTimeSince(
        `${Math.floor(timeDifference / 60)} ${t('timeSince.minutes')}`,
      );
    } else if (timeDifference < 86400) {
      setTimeSince(
        `${Math.floor(timeDifference / 3600)} ${t('timeSince.hours')}`,
      );
    } else if (timeDifference < 2592000) {
      setTimeSince(
        `${Math.floor(timeDifference / 86400)} ${t('timeSince.days')}`,
      );
    } else {
      setTimeSince(
        `${Math.floor(timeDifference / 2592000)} ${t('timeSince.month')}`,
      );
    }
  }, [timestamp]);

  return timeSince;
}
