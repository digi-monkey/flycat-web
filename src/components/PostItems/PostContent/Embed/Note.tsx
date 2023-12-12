import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { NoteResult } from 'core/nip/21';
import { EmbedPostUI } from 'components/PostItems/PostItem/embed';
import { PostContent } from '../index';

import styles from './index.module.scss';

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
              isExpanded={true}
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
        onClick={e => e.stopPropagation()}
      >
        note@{note.eventId}
      </a>
    </div>
  );
};
