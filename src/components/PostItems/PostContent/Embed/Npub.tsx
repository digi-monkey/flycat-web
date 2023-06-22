import { Avatar } from 'antd';
import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { shortifyPublicKey } from 'service/nostr/content';
import { NpubResult } from 'service/nip/21';

import styles from './index.module.scss';

export const Npub = (npub: NpubResult) => {
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

  return (
    <div className={styles.refLink}>
      <a href={i18n?.language + Paths.user + npub.pubkey} target="_blank">
        npub@{shortifyPublicKey(npub.pubkey)}
      </a>
    </div>
  );
};
