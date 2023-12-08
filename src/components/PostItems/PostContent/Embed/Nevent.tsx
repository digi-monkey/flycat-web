import { NeventResult } from 'core/nip/21';
import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { EmbedPostUI } from 'components/PostItems/PostItem/embed';

import styles from './index.module.scss';

export const Nevent: React.FC<{
  nevent: NeventResult;
}> = ({ nevent }) => {
  if (nevent.noteEvent) {
    return (
      <div className={styles.refNote}>
        <EmbedPostUI
          content={<div>{nevent.noteEvent.content}</div>}
          profile={nevent.profile}
          event={nevent.noteEvent as any}
        />
      </div>
    );
  }

  return (
    <div className={styles.refLink}>
      <a
        href={
          '/' + i18n?.language + Paths.user + '/' + nevent.decodedMetadata.id
        }
        target="_self"
      >
        nevent@${nevent.decodedMetadata.id}
      </a>
    </div>
  );
};
