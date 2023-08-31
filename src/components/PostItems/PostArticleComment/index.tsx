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
  EventSetMetadataContent,
  EventTags,
  Filter,
  UserMap,
  WellKnownEventKind,
} from 'core/nostr/type';
import { PostContent } from '../PostContent';
import { CallWorker } from 'core/worker/caller';
import { useRouter } from 'next/router';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbQuery, dexieDb } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { seedRelays } from 'core/relay/pool/seed';

interface PostArticleCommentProps {
  event: Event;
  worker: CallWorker;
  showReplyArticle?: boolean;
}

const PostArticleComment: React.FC<PostArticleCommentProps> = ({
  event,
  worker,
  showReplyArticle = true,
}) => {
  const { t } = useTranslation();
  const aTag = Nip23.getATag(event);
  const addr = aTag[1];
  const { pubkey, articleId } = Nip23.addrToPkAndId(addr);
  const router = useRouter();

  const [loadedUserProfile, setLoadedUserProfile] =
    useState<EventSetMetadataContent>();
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

  const loadUserProfile = async () => {
    // todo: set relay urls with correct one
    const profileEvent = await dexieDb.profileEvent.get(pubkey); 
    if (profileEvent) {
      const metadata = JSON.parse(
        profileEvent.content,
      ) as EventSetMetadataContent;
      setLoadedUserProfile(metadata);
    }
  };
  useEffect(()=>{
    loadUserProfile();
  }, [pubkey])

  const filter: Filter = {
    authors: [pubkey],
    kinds: [WellKnownEventKind.long_form],
    "#d": [articleId]
  }
  const relayUrls = worker.relays.map(r => r.url) || [];
  const articleEvent: DbEvent[] = useLiveQuery(dbQuery.createEventQuerier(filter, relayUrls), [articleId, relayUrls], []);
  const article = articleEvent.length > 0 ? Nip23.toArticle(articleEvent[0]) : null;

  return (
    <>
      <PostContent
        ownerEvent={event}
        worker={worker}
        showLastReplyToEvent={false}
      />
      {showReplyArticle && (
        <div
          className={styles.article}
          style={bgStyle}
          onClick={() => router.push(Nip23.addrToUrl(addr), '_blank')}
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
                <Avatar src={loadedUserProfile?.picture} alt="picture" />
                <span className={styles.name}>{loadedUserProfile?.name || '...'}</span>
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
