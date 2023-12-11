import { Avatar } from 'antd';
import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { shortifyPublicKey } from 'core/nostr/content';
import { NpubResult } from 'core/nip/21';

import styles from './index.module.scss';

export const Npub: React.FC<{npub: NpubResult}> = ({npub}) => {
  if (npub.profile) {
    return (
      <span>
        <a
          href={Paths.user + npub.pubkey}
          target="_blank"
          className={styles.hoverLink}
          onClick={e => e.stopPropagation()}
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
    <span className={styles.refLink}>
      <a href={i18n?.language + Paths.user + npub.pubkey} target="_blank" onClick={e => e.stopPropagation()}>
        npub@{shortifyPublicKey(npub.pubkey)}
      </a>
    </span>
  );
};
