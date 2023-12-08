import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { NoteResult } from 'core/nip/21';
import { EmbedPostUI } from 'components/PostItems/PostItem/embed';

import styles from './index.module.scss';
import PostContent from '..';

export const Note: React.FC<{
  note: NoteResult;
}> = ({ note }) => {
  if (note.noteEvent) {
    return (
      <div className={styles.refNote}>
        <EmbedPostUI
          content={
            <PostContent
              ownerEvent={note.noteEvent}
              showLastReplyToEvent={false}
            />
          }
          profile={note.profile}
          event={note.noteEvent as any}
        />
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
