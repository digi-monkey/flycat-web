import { Avatar } from 'antd';
import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { shortifyPublicKey } from 'core/nostr/content';
import { NpubResult } from 'core/nip/21';

import styles from './index.module.scss';
import { EventSetMetadataContent, UserMap } from 'core/nostr/type';
import { dbQuery } from 'core/db';
import { seedRelays } from 'core/relay/pool/seed';
import { useState } from 'react';
import { DbEvent } from 'core/db/schema';

export const Npub = (npub: NpubResult, profileEvents: DbEvent[]) => {
  const loadedUserProfile = profileEvents.filter(e => npub.pubkey === e.pubkey).map(e => JSON.parse(e.content) as EventSetMetadataContent).find(e => true);

  if (npub.profile) {
    return (
      <span>
        <a
          href={Paths.user + npub.pubkey}
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

  if (loadedUserProfile) {
    const profile = loadedUserProfile;
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
