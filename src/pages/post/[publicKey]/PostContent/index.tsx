import { Paths } from 'constants/path';
import { calculateReadTime, formatLongDate } from 'utils/time';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';

import Link from 'next/link';
import styles from './index.module.scss';
import ReactMarkdown from 'react-markdown';
import { isValidPublicKey } from 'utils/validator';
import { Button } from 'components/shared/ui/Button';
import Avatar from 'components/shared/ui/Avatar';

const PostContent = ({ article, publicKey, userProfile, articleId, t }) => {
  const myPublicKey = useReadonlyMyPublicKey();
  return (
    <div className={styles.postContent}>
      <div className={styles.postHeader}>
        {article?.image && (
          <img
            src={article.image}
            className={styles.banner}
            alt={article?.title}
          />
        )}
        <div className={styles.postTitleInfo}>
          <div className={styles.title}>{article?.title}</div>
          {article?.summary && (
            <div className={styles.summary}>{article.summary}</div>
          )}
          <div className={styles.author}>
            <div className={styles.info}>
              <div className={styles.img}>
                <Link href={Paths.user + publicKey}>
                  <Avatar
                    src={userProfile?.picture}
                    fallback={userProfile.name.slice(0, 2)}
                  />
                </Link>
              </div>
              <div className={styles.text}>
                <div className={styles.username}>
                  <Link href={Paths.user + publicKey}>{userProfile?.name}</Link>
                </div>
                <div className={styles.time}>
                  {article && (
                    <span>
                      {calculateReadTime(article.content)}
                      {' read • '}
                      {formatLongDate(
                        article.published_at || article.updated_at,
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div>
              {publicKey !== myPublicKey && (
                <Link href={`${Paths.user + publicKey}`}>
                  <Button>{'View Profile'}</Button>
                  {/*todo: fix to follow/unfollow*/}
                </Link>
              )}
              {isValidPublicKey(publicKey) && publicKey === myPublicKey && (
                <Link href={`${Paths.edit}${publicKey}/${articleId}`}>
                  <Button>{'Edit this post'}</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.articleText}>
        <ReactMarkdown
          components={{
            img: ({ node, ...props }) => (
              <img className={styles.articleImg} {...props} />
            ),
          }}
        >
          {article.content.replace(/\n\n/gi, '&nbsp; \n\n')}
        </ReactMarkdown>
      </div>

      <div className={styles.postTags}>
        {article?.hashTags
          ?.flat(Infinity)
          .map((t, key) => <span key={key}>#{t}</span>)}
      </div>
    </div>
  );
};

export default PostContent;
