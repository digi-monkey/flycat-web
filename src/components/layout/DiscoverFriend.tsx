import Link from 'next/link';
import { UserMap } from 'service/type';
import { ProfileAvatar } from './msg/TextMsg';
import { useTranslation } from 'next-i18next';
import { Paths } from 'constants/path';

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
      {pks.map((pk, index) => (
        <span
          key={pk}
          style={{
            marginRight: '10px',
            display: 'inline-block',
            width: '80px',
            height: '80px',
            overflowX: 'hidden',
          }}
        >
          <ProfileAvatar picture={userMap.get(pk)?.picture} name={pk} />
          <UserName name={userMap.get(pk)?.name} pk={pk} />
        </span>
      ))}
    </div>
  );
};

export const UserName = ({ name, pk }: { name?: string; pk: string }) => {
  return (
    <div>
      <Link style={{ fontSize: '14px' }} href={`${Paths.user + pk}`}>
        @{name || '__'}
      </Link>
    </div>
  );
};
