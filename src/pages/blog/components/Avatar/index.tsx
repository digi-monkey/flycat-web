import { Paths } from 'constants/path';
import { ProfileAvatar } from 'components/layout/msg/TextMsg';

import Link from 'next/link';
import styles from './index.module.scss';

const Avatar = ({ userMap, publicKey}) => (
  <div className={styles.avatar}>
    <ProfileAvatar picture={userMap.get(publicKey)?.picture} name={publicKey} />
    <Link href={Paths.user+publicKey}>
      @{userMap.get(publicKey)?.name || '__'}
    </Link>
  </div>  
);

export default Avatar;