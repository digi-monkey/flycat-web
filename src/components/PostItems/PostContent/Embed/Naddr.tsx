import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { NaddrResult } from 'core/nip/21';

import styles from './index.module.scss';
import { shortifyPublicKey } from 'core/nostr/content';

export const Naddr = (naddr: NaddrResult) => {
  if (naddr.replaceableEvent) {
    return <div>{naddr.replaceableEvent.content}</div>;
  }

  return (
    <div className={styles.refLink}>
      <a
        href={i18n?.language + Paths.user + naddr.decodedMetadata.kind}
        target="_blank"
      >
        naddr@{shortifyPublicKey(naddr.decodedMetadata.pubkey)}:$
        {naddr.decodedMetadata.kind}:$
        {naddr.decodedMetadata.identifier}
      </a>
    </div>
  );
};
