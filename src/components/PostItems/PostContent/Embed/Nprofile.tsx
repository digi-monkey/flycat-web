import { Avatar } from 'antd';
import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { shortPublicKey } from 'service/helper';
import { NprofileResult } from 'service/nip/21';

import styles from './index.module.scss';

export const Nprofile = (nprofile: NprofileResult) => {
  if (nprofile.profile) {
    return (
      <div className={styles.refProfile}>
        <div className={styles.user}>
          <Avatar src={nprofile.profile.picture} alt="picture" /> @
          {nprofile.profile.name ||
            shortPublicKey(nprofile.decodedMetadata.pubkey)}
        </div>
        <div>{nprofile.profile.about}</div>
      </div>
    );
  }

  return (
    <div className={styles.refLink}>
      <a
        href={i18n?.language + Paths.user + nprofile.decodedMetadata.pubkey}
        target="_blank"
      >
        nprofile@{shortPublicKey(nprofile.decodedMetadata.pubkey)}
      </a>
    </div>
  );
};
