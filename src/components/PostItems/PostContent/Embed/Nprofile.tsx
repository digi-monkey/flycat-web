import { Avatar } from 'antd';
import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { shortifyPublicKey } from 'core/nostr/content';
import { NprofileResult } from 'core/nip/21';

import styles from './index.module.scss';
import { UserMap } from 'core/nostr/type';

export const Nprofile = (nprofile: NprofileResult, userMap: UserMap) => {
  if (nprofile.profile) {
    return (
      <span>
      <a
        href={Paths.user + nprofile.decodedMetadata.pubkey}
        target="_blank"
        className={styles.hoverLink}
      >
        @{nprofile.profile.name || shortifyPublicKey(nprofile.decodedMetadata.pubkey)}
      </a>
      <div className={styles.refProfile}>
        <div className={styles.user}>
          <Avatar src={nprofile.profile.picture} alt="picture" /> @
          {nprofile.profile.name ||
            shortifyPublicKey(nprofile.decodedMetadata.pubkey)}
        </div>
        <div>{nprofile.profile.about}</div>
      </div>
      </span> 
    );
  }

  if (userMap.get(nprofile.key)) {
    const profile = userMap.get(nprofile.key)!; 
    return (
      <span>
      <a
        href={i18n?.language + Paths.user + nprofile.decodedMetadata.pubkey}
        target="_blank"
        className={styles.hoverLink}
      >
        @{profile.name}
      </a>
      <div className={styles.refProfile}>
        <div className={styles.user}>
          <Avatar src={profile.picture} alt="picture" /> @
          {profile.name ||
            shortifyPublicKey(nprofile.decodedMetadata.pubkey)}
        </div>
        <div>{profile.about}</div>
      </div>
      </span> 
    );
  }

  return (
    <div className={styles.refLink}>
      <a
        href={i18n?.language + Paths.user + nprofile.decodedMetadata.pubkey}
        target="_blank"
      >
        nprofile@{shortifyPublicKey(nprofile.decodedMetadata.pubkey)}
      </a>
    </div>
  );
};
