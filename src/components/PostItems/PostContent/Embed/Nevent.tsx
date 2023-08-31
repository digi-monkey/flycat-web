import { NeventResult } from 'core/nip/21';
import { Avatar } from 'antd';
import { shortifyPublicKey } from 'core/nostr/content';
import { MediaPreviews } from '../Media';
import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';

import styles from './index.module.scss';
import { EventSetMetadataContent } from 'core/nostr/type';
import { dbQuery } from 'core/db';
import { seedRelays } from 'core/relay/pool/seed';
import { useState } from 'react';
import { DbEvent } from 'core/db/schema';

export const Nevent = (nevent: NeventResult, profileEvents: DbEvent[]) => {
  if (nevent.noteEvent) {
    const loadedUserProfile = profileEvents.filter(e => nevent.noteEvent!.pubkey === e.pubkey).map(e => JSON.parse(e.content) as EventSetMetadataContent).find(e => true);
    return (
      <div className={styles.refNote}>
        <div>
          <Avatar src={loadedUserProfile?.picture} alt="picture" />
          {loadedUserProfile?.name || shortifyPublicKey(nevent.noteEvent.pubkey)}
        </div>
        {nevent.noteEvent.content}
        <MediaPreviews content={nevent.noteEvent.content} />
      </div>
    );
  }

  return (
	<div className={styles.refLink}>
    <a
      href={'/' + i18n?.language + Paths.user + '/' + nevent.decodedMetadata.id}
      target="_self"
    >
      nevent@${nevent.decodedMetadata.id}
    </a>
    </div>
  );
};
