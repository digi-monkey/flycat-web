import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import { ArticleTrendsItem } from './msg/Content';
import { ProfileAvatar, ProfileName } from './msg/TextMsg';

export const DiscoveryFriend = ({
  pks,
  userMap,
}: {
  pks: string[];
  userMap: UserMap;
}) => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        background: '#F6F9F9',
        padding: '10px',
        borderRadius: '5px',
        height: '100%',
      }}
    >
      <div
        style={{
          fontSize: '20px',
          fontWeight: '600',
          margin: '0px 10px 20px 5px',
          display: 'flex',
        }}
      >
        {t('friendDiscover.title')}
      </div>
      {pks.length === 0 && <p>{t('friendDiscover.noFriend')}</p>}
      {pks.map((a, index) => (
        <span
          style={{
            marginRight: '10px',
            display: 'inline-block',
            width: '80px',
            height: '80px',
            overflowX: 'hidden',
          }}
        >
          <ProfileAvatar picture={userMap.get(a)?.picture} name={a} />
          <UserName name={userMap.get(a)?.name} pk={a} />
        </span>
      ))}
    </div>
  );
};

export const UserName = ({ name, pk }: { name?: string; pk: string }) => {
  return (
    <div>
      <a style={{ fontSize: '14px' }} href={'/user/' + pk}>
        @{name || '__'}
      </a>
    </div>
  );
};
