import { Repost } from 'components/layout/msg/reaction/Repost';
import { Tipping } from 'components/layout/msg/reaction/Tipping';
import { Article } from 'service/nip/23';
import { Bookmark } from 'components/layout/msg/reaction/Bookmark';
import { isEmptyStr } from 'service/helper';
import styles from './index.module.scss';

export const Reactions = ({ article, pk, lightingAddress}: {
  pk: string;
  article: Article;
  lightingAddress?: string;
}) => (
  <div className={styles.reaction}>
    {!isEmptyStr(lightingAddress) && (
      <Tipping address={lightingAddress!} />
    )}

    <Repost eventId={article.eventId} onClick={() => alert('working on it!')} />
    <Bookmark eventId={article.eventId} onClick={() => alert('working on it!')} />
  </div>
);
