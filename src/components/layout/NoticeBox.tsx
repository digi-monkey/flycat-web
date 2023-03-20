import React from 'react';
import { useTranslation } from 'next-i18next';

const styles = {
  simpleUl: {
    padding: '0px',
    margin: '20px 0px',
    listStyle: 'none' as const,
  },
  menu: {
    padding: '0px',
  },
};

export const NoticeBox = () => {
  const { t } = useTranslation();
  return (
    <ul style={styles.simpleUl}>
      <li style={styles.menu}>
        <a href="http://">{t('noticeBox.blog')}</a>
      </li>
      <li style={styles.menu}>
        <a href="http://">{t('noticeBox.mention')}</a>
      </li>
      <li style={styles.menu}>
        <a href="http://">{t('noticeBox.msg')}</a>
      </li>
    </ul>
  );
};
