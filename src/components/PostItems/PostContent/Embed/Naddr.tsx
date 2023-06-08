import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { NaddrResult } from 'service/nip/21';

import styles from './index.module.scss';
import { shortPublicKey } from 'service/helper';

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
        naddr@{shortPublicKey(naddr.decodedMetadata.pubkey)}:$
        {naddr.decodedMetadata.kind}:$
        {naddr.decodedMetadata.identifier}
      </a>
    </div>
  );
};
