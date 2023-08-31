import { Avatar } from 'antd';
import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { shortifyPublicKey } from 'core/nostr/content';
import { NoteResult } from 'core/nip/21';
import { MediaPreviews } from '../Media';

import styles from './index.module.scss';
import { EventSetMetadataContent } from 'core/nostr/type';
import { dbQuery } from 'core/db';
import { useState } from 'react';
import { seedRelays } from 'core/relay/pool/seed';
import { DbEvent } from 'core/db/schema';

export const Note = (note: NoteResult, profileEvents: DbEvent[]) => {  
  if (note.noteEvent) {
    const loadedUserProfile = profileEvents.filter(e => note.noteEvent!.pubkey === e.pubkey).map(e => JSON.parse(e.content) as EventSetMetadataContent).find(e => true);
    return (
      <div className={styles.refNote}>
        <div>
          <Avatar src={loadedUserProfile?.picture} alt="picture" /> 
          {loadedUserProfile?.name || shortifyPublicKey(note.noteEvent.pubkey)}
        </div>
        {note.noteEvent.content}
        <MediaPreviews content={note.noteEvent.content} />
      </div>
    );
  }

  return (
    <div className={styles.refLink}>
      <a
        href={'/' + i18n?.language + Paths.event + '/' + note.eventId}
        target="_blank"
      >
        note@{note.eventId}
      </a>
    </div>
  );
};
