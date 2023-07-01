import { Avatar } from 'antd';
import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { shortifyPublicKey } from 'core/nostr/content';
import { NpubResult } from 'core/nip/21';

import styles from './index.module.scss';
import { UserMap } from 'core/nostr/type';

export const Npub = (npub: NpubResult, userMap: UserMap) => {
  if (npub.profile) {
    return (
      <span>
        <a
        href={i18n?.language + Paths.user + npub.pubkey}
        target="_blank"
        className={styles.hoverLink}
      >
        @{npub.profile.name}
      </a>
      
      <div className={styles.refProfile}>
        <div className={styles.user}>
          <Avatar src={npub.profile.picture} alt="picture" /> @
          {npub.profile.name || shortifyPublicKey(npub.pubkey)}
        </div>
        <div>{npub.profile.about}</div>
      </div>
      </span>
    );
  }

  if (userMap.get(npub.key)) {
    const profile = userMap.get(npub.key)!;
    return (
      <span>
        <a
        href={i18n?.language + Paths.user + npub.pubkey}
        target="_blank"
        className={styles.hoverLink}
      >
        @{profile.name}
      </a>
      
      <div className={styles.refProfile}>
        <div className={styles.user}>
          <Avatar src={profile.picture} alt="picture" /> @
          {profile.name || shortifyPublicKey(npub.pubkey)}
        </div>
        <div>{profile.about}</div>
      </div>
      </span>
    );
  }

  return (
    <div className={styles.refLink}>
      <a href={i18n?.language + Paths.user + npub.pubkey} target="_blank">
        npub@{shortifyPublicKey(npub.pubkey)}
      </a>
    </div>
  );
};
