import React from 'react';
import { useTranslation } from 'react-i18next';
import { shortPublicKey } from 'service/helper';

const styles = {
  userName: {
    textDecoration: 'underline',
    marginRight: '5px',
  },
};
export interface ReplyToUser {
  name?: string;
  pk: string;
}

export interface ReplyToUserListProps {
  replyTo: ReplyToUser[];
}

export const ReplyUserList = ({ replyTo }: ReplyToUserListProps) => {
  const { t } = useTranslation();
  return (
    <>
      {replyTo.length > 0 && (
        <span style={{ color: 'gray' }}>
          {t('textMsg.replyTo')}{' '}
          {replyTo.map((r, i) => (
            <a
              key={i}
              style={{ ...styles.userName, ...{ color: 'gray' } }}
              href={'/user/' + r.pk}
            >
              @{r.name || shortPublicKey(r.pk!)}
            </a>
          ))}
        </span>
      )}
    </>
  );
};
