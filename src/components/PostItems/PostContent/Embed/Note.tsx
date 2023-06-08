import { Avatar } from 'antd';
import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { shortPublicKey } from 'service/helper';
import { NoteResult } from 'service/nip/21';
import { MediaPreviews } from '../Media';

import styles from './index.module.scss';

export const Note = (note: NoteResult) => {
  if (note.noteEvent) {
    return (
      <div className={styles.refNote}>
        <div>
          <Avatar src={''} alt="picture" /> @
          {shortPublicKey(note.noteEvent.pubkey)}
        </div>
        {note.noteEvent.content}
        <MediaPreviews content={note.noteEvent.content} />
      </div>
    );
  }

  return (
    <a
      href={'/' + i18n?.language + Paths.event + '/' + note.eventId}
      target="_blank"
    >
      note@${note.eventId}
    </a>
  );
};
