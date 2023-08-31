import { Avatar } from 'antd';
import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { shortifyPublicKey } from 'core/nostr/content';
import { NprofileResult } from 'core/nip/21';

import styles from './index.module.scss';
import { EventSetMetadataContent, UserMap } from 'core/nostr/type';
import { useState } from 'react';
import { dbQuery } from 'core/db';
import { seedRelays } from 'core/relay/pool/seed';
import { DbEvent } from 'core/db/schema';

export const Nprofile = (nprofile: NprofileResult, profileEvents: DbEvent[]) => {
  const loadedUserProfile = profileEvents.filter(e => nprofile.decodedMetadata.pubkey === e.pubkey).map(e => JSON.parse(e.content) as EventSetMetadataContent).find(e => true);
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

  if (loadedUserProfile) {
    return (
      <span>
      <a
        href={i18n?.language + Paths.user + nprofile.decodedMetadata.pubkey}
        target="_blank"
        className={styles.hoverLink}
      >
        @{loadedUserProfile.name}
      </a>
      <div className={styles.refProfile}>
        <div className={styles.user}>
          <Avatar src={loadedUserProfile.picture} alt="picture" /> @
          {loadedUserProfile.name ||
            shortifyPublicKey(nprofile.decodedMetadata.pubkey)}
        </div>
        <div>{loadedUserProfile.about}</div>
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
