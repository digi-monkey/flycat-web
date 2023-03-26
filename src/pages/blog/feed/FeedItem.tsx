import { Paths } from 'constants/path';
import { Article } from 'service/nip/23';
import { TagItem } from '../hashTags/TagItem';
import { useRouter } from 'next/router';
import { maxStrings } from 'service/helper';
import { Reactions } from './Reactions';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import styles from './index.module.scss';

export interface BlogFeedItemProps {
  article: Article;
  lightingAddress?: string;
}
export function PersonalBlogFeedItem({
  article,
  lightingAddress,
}: BlogFeedItemProps) {
  const router = useRouter();
  const myPublicKey = useReadonlyMyPublicKey();

  return (
    <div
      style={{
        borderBottom: '1px dashed rgb(221, 221, 221)',
        margin: '5px 0px',
        padding: '10px 0px',
      }}
    >
      <div
        style={{
          display: 'flex',
          cursor: 'pointer',
        }}
        onClick={() => router.push({ pathname: `${Paths.post + article.pubKey}/${article.id}` })}
      >
        {article.image && (
          <span
            style={{
              width: '100px',
              height: '100px',
              marginRight: '10px',
            }}
          >
            <img
              src={article.image}
              alt={article.title}
              style={{ maxWidth: '100px', maxHeight: '100%' }}
            />
          </span>
        )}
        <div style={{}}>
          {article.title && (
            <span
              style={{
                fontSize: '16px',
                marginBottom: '5px',
                display: 'block',
                textTransform: 'capitalize',
              }}
            >
              {article.title}
            </span>
          )}
          {article.summary && (
            <p style={{ fontSize: '12px', color: 'gray' }}>
              {maxStrings(article.summary, 140)}
            </p>
          )}
        </div>
      </div>
      <div style={{ color: 'gray', fontSize: '12px', marginTop: '5px' }}>
        <span>
          {article.hashTags?.slice(0, 5).map((a, key) => (
            <TagItem tag={a} key={key} />
          ))}
          <Reactions
            article={article}
            pk={myPublicKey}
            lightingAddress={lightingAddress}
          />
        </span>
      </div>
    </div>
  );
}

export function BlogFeedItem({ article, lightingAddress }: BlogFeedItemProps) {
  const router = useRouter();
  const myPublicKey = useReadonlyMyPublicKey();

  return (
    <>
      <div
        className={styles.bolgFeedItem} 
        onClick={() => router.push({ pathname: `${Paths.post + article.pubKey}/${article.id}` })}
      >
        {article.image && (<img src={article.image} alt={article.title} />)}

        <div className={styles.bolgFeedItemContent}>
          {article.title && (<span className={styles.title}>{article.title}</span>)}
          {article.summary && (<p>{maxStrings(article.summary, 140)}</p>)}
        </div>
      </div>
      <div className={styles.tags}>
        {article.hashTags?.slice(0, 5).map((a, key) => (
          <TagItem tag={a} key={key} />
        ))}
        <Reactions
          article={article}
          pk={myPublicKey}
          lightingAddress={lightingAddress}
        />
      </div>
    </>
  );
}
