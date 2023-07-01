import { Avatar } from 'antd';
import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { shortifyPublicKey } from 'core/nostr/content';
import { NoteResult } from 'core/nip/21';
import { MediaPreviews } from '../Media';

import styles from './index.module.scss';
import { UserMap } from 'core/nostr/type';

export const Note = (note: NoteResult, userMap: UserMap) => {
  if (note.noteEvent) {
    return (
      <div className={styles.refNote}>
        <div>
          <Avatar src={userMap.get(note.noteEvent.pubkey)?.picture} alt="picture" /> 
          {userMap.get(note.noteEvent.pubkey)?.name || shortifyPublicKey(note.noteEvent.pubkey)}
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
