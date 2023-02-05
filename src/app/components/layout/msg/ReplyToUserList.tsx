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

export const ReplyToUserList = ({ replyTo }: ReplyToUserListProps) => {
  const { t } = useTranslation();
  return (
    <div style={{ marginBottom: '2px' }}>
      {replyTo.length > 0 && (
        <span style={{ color: 'gray', fontSize: '12px' }}>
          {t('textMsg.replyTo')}{' '}
          {replyTo.map((r, i) => (
            <a
              key={i}
              style={{
                ...styles.userName,
                ...{ color: 'gray', fontSize: '12px' },
              }}
              href={'/user/' + r.pk}
            >
              @{r.name || shortPublicKey(r.pk!)}
            </a>
          ))}
        </span>
      )}
    </div>
  );
};
