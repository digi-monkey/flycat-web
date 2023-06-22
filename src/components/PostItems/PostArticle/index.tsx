import { Nip23 } from 'service/nip/23';
import { Event } from 'service/event/Event';
import { Avatar } from 'antd';
import { useTranslation } from 'next-i18next';

import Icon from 'components/Icon';
import styles from './index.module.scss';
import classNames from 'classnames';

interface PostArticleProps {
  userAvatar: string;
  userName: string;
  event: Event;
}

const PostArticle: React.FC<PostArticleProps> = ({ userAvatar, userName, event }) => {
  const { t } = useTranslation();
  const article = Nip23.toArticle(event);
  const { pubKey: author, id: articleId, title, image, summary } = article;
  const addr = Nip23.getAddr(author, articleId);
  
  return <div className={styles.article} onClick={() => window.open(Nip23.addrToUrl(addr), '_blank')}>
    { image && <img src={image} alt={title || ''} /> }
    <div className={styles.content}>
      <div className={styles.tag}>
        <Icon type="icon-receipt" />
        <span>Article</span>
      </div>
      <div className={styles.info}>
        <div className={styles.user}>
          <Avatar src={userAvatar} alt='picture' />
          <span className={styles.name}>{userName}</span>
        </div>
        <h1 className={classNames('f-truncate', styles.title)} title={title}>{title}</h1>
        <p className={classNames('f-clamp', styles.summary)} title={summary}>{summary}</p>
      </div>
    </div>
  </div>
}

export default PostArticle;
