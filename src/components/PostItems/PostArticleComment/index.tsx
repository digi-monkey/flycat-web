import { Nip23 } from 'core/nip/23';
import { Event } from 'core/nostr/Event';
import { Avatar } from 'antd';
import { useTranslation } from 'next-i18next';

import Icon from 'components/Icon';
import styles from './index.module.scss';
import classNames from 'classnames';
import { getRandomIndex } from 'utils/common';
import { CSSProperties, useEffect, useState } from 'react';
import {
  EventMap,
  EventTags,
  UserMap,
  WellKnownEventKind,
} from 'core/nostr/type';
import { PostContent } from '../PostContent';
import { CallWorker } from 'core/worker/caller';

interface PostArticleCommentProps {
  eventMap: EventMap;
  userMap: UserMap;
  event: Event;
  worker: CallWorker;
  showReplyArticle?: boolean;
}

const PostArticleComment: React.FC<PostArticleCommentProps> = ({
  eventMap,
  userMap,
  event,
  worker,
  showReplyArticle = true,
}) => {
  const { t } = useTranslation();
  const aTag = Nip23.getATag(event);
  const addr = aTag[1];
  const { pubkey, articleId } = Nip23.addrToPkAndId(addr);

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

  const author = userMap.get(pubkey);

  let articleEvent: Event | null = null;
  // todo: the loop for eventMap is very expensive, maybe update the key structure or use an new map for long-form
  eventMap.forEach((v, _k) => {
    if (
      v.pubkey === pubkey &&
      v.kind === WellKnownEventKind.long_form &&
      v.tags.filter(t => t[0] === EventTags.D && t[1] === articleId).length > 0
    ) {
      articleEvent = v;
    }
  });

  const article = articleEvent ? Nip23.toArticle(articleEvent) : null;

  return (
    <>
      <PostContent
        eventMap={eventMap}
        userMap={userMap}
        ownerEvent={event}
        worker={worker}
        showLastReplyToEvent={false}
      />
      {showReplyArticle && (
        <div
          className={styles.article}
          style={bgStyle}
          onClick={() => window.open(Nip23.addrToUrl(addr), '_blank')}
        >
          {article?.image && (
            <img src={article?.image} alt={article?.title || ''} />
          )}
          <div className={styles.content}>
            <div className={styles.tag}>
              <Icon type="icon-receipt" />
              <span>Article</span>
            </div>
            <div className={styles.info}>
              <div className={styles.user}>
                <Avatar src={author?.picture} alt="picture" />
                <span className={styles.name}>{author?.name || '...'}</span>
              </div>
              <h1
                className={classNames('f-truncate', styles.title)}
                title={article?.title}
              >
                {article?.title || 'No Title'}
              </h1>
              <p
                className={classNames('f-clamp', styles.summary)}
                title={article?.summary}
              >
                {article?.summary}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostArticleComment;
