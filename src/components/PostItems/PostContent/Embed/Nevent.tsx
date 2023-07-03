import { NeventResult } from 'core/nip/21';
import { Avatar } from 'antd';
import { shortifyPublicKey } from 'core/nostr/content';
import { MediaPreviews } from '../Media';
import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';

import styles from './index.module.scss';
import { UserMap } from 'core/nostr/type';

export const Nevent = (nevent: NeventResult, userMap: UserMap) => {
  if (nevent.noteEvent) {
    return (
      <div className={styles.refNote}>
        <div>
          <Avatar src={userMap.get(nevent.noteEvent.pubkey)?.picture} alt="picture" />
          {userMap.get(nevent.noteEvent.pubkey)?.name || shortifyPublicKey(nevent.noteEvent.pubkey)}
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
