import { Avatar } from 'antd';
import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { shortPublicKey } from 'service/helper';
import { NpubResult } from 'service/nip/21';

import styles from './index.module.scss';

export const Npub = (npub: NpubResult) => {
  if (npub.profile) {
    return (
      <div className={styles.refProfile}>
        <div className={styles.user}>
          <Avatar src={npub.profile.picture} alt="picture" /> @
          {npub.profile.name || shortPublicKey(npub.pubkey)}
        </div>
        <div>{npub.profile.about}</div>
      </div>
    );
  }

  return (
    <div className={styles.refLink}>
      <a href={i18n?.language + Paths.user + npub.pubkey} target="_blank">
        npub@{shortPublicKey(npub.pubkey)}
      </a>
    </div>
  );
};
