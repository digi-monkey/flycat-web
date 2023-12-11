import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';
import { NaddrResult } from 'core/nip/21';
import { shortifyPublicKey } from 'core/nostr/content';
import { Nip23 } from 'core/nip/23';
import { maxStrings } from 'utils/common';

import Icon from 'components/Icon';
import Link from 'next/link';
import styles from './index.module.scss';

export const Naddr: React.FC<{naddr: NaddrResult}> = ({naddr}) => {
  if (naddr.replaceableEvent) {
    const isBlogPost = Nip23.isBlogPost(naddr.replaceableEvent);
    if (isBlogPost) {
      const article = Nip23.toArticle(naddr.replaceableEvent);
      return (
        <div className={styles.refLongForm}>
          <Icon type="icon-article" />
          <Link href={'/post/' + article.pubKey + '/' + article.id} onClick={e => e.stopPropagation()}>
            {article.title || 'No Title'}
          </Link>{' '}
          <span className={styles.summary}>
            {maxStrings(article.summary || '', 20)}
          </span>
        </div>
      );
    }
    return <div>{naddr.replaceableEvent.content}</div>;
  }

  if (naddr.decodedMetadata.kind === Nip23.kind) {
    return (
      <div className={styles.refLink}>
        <a
          href={
            Paths.post +
            naddr.decodedMetadata.pubkey +
            '/' +
            naddr.decodedMetadata.identifier
          }
          target="_blank"
          onClick={e => e.stopPropagation()}
        >
          longFrom@{shortifyPublicKey(naddr.decodedMetadata.pubkey)}:
          {naddr.decodedMetadata.kind}:{naddr.decodedMetadata.identifier}
        </a>
      </div>
    );
  }

  return (
    <div className={styles.refLink}>
      <a
        href={i18n?.language + Paths.user + naddr.decodedMetadata.kind}
        target="_blank"
        onClick={e => e.stopPropagation()}
      >
        naddr@{shortifyPublicKey(naddr.decodedMetadata.pubkey)}:
        {naddr.decodedMetadata.kind}:{naddr.decodedMetadata.identifier}
      </a>
    </div>
  );
};
