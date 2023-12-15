import { Nip23 } from 'core/nip/23';
import { Event } from 'core/nostr/Event';
import { useTranslation } from 'next-i18next';

import Icon from 'components/Icon';
import styles from './index.module.scss';
import classNames from 'classnames';
import { getRandomIndex } from 'utils/common';
import { CSSProperties, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUserProfile } from 'hooks/useUserProfile';
import { isNip05DomainName } from 'core/nip/05';

interface PostArticleProps {
  event: Event;
}

const PostArticle: React.FC<PostArticleProps> = ({ event }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const article = Nip23.toArticle(event);
  const { pubKey: author, id: articleId, title, image, summary } = article;
  const addr = Nip23.getAddr(author, articleId);
  const authorProfile = useUserProfile(author);

  const buildArticleUrl = () => {
    if (authorProfile?.nip05 && isNip05DomainName(authorProfile?.nip05)) {
      // check .bit too?
      return `/post/${authorProfile.nip05}/${articleId}`;
    }
    return Nip23.addrToUrl(addr);
  };

  const [bgStyle, setBgStyle] = useState<CSSProperties | undefined>();
  useEffect(() => {
    // todo: how to load cover colors from global styles?
    const coverColors = ['#F18B8E', '#FFD09A', '#C0E085', '#ABD1EB', '#E3BBEA'];
    const randomIndex = getRandomIndex(coverColors);
    const opacity = 0.6;
    const dynamicStyle = {
      backgroundColor: `${coverColors[randomIndex]}${Math.round(
        opacity * 255,
      ).toString(16)}`,
    };
    setBgStyle(dynamicStyle);
  }, []);

  return (
    <div
      className={styles.article}
      style={bgStyle}
      onClick={() => router.push(buildArticleUrl())}
    >
      {image && <img src={image} alt={title || ''} />}
      <div className={styles.content}>
        <div className={styles.tag}>
          <Icon type="icon-receipt" />
          <span>Article</span>
        </div>
        <div className={styles.info}>
          <h1 className={classNames('f-truncate', styles.title)} title={title}>
            {title}
          </h1>
          <p className={classNames('f-clamp', styles.summary)} title={summary}>
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PostArticle;
