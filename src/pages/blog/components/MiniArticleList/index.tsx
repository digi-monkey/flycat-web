import { Paths } from "constants/path";
import { useTimeSince } from "hooks/useTimeSince";

import Link from "next/link";
import styles from './index.module.scss';
import EditIcon from '@mui/icons-material/Edit';

const MiniArticleList = ({ title, articles, authorPk, isOwner }) => {
  const Updated = ({ article }) => <span className={styles.updated}>{useTimeSince(article.updated_at)}</span>;

  return (
    <>
      <h3 className={styles.articlesListTitle}>{title}</h3>
      <div className={styles.articleList}>
        {articles.map((article, key) => (
          <div className={styles.articleItem} key={key}>
            <div className={styles.article}>
              <Link
                href={`${Paths.post + authorPk}/${article.id}`}
                target="_blank"
                rel="noreferrer"
              >
                {article.title}
              </Link>
              <Updated article={article} />
            </div>

            {isOwner && (
              <Link className={styles.icon} href={`${Paths.edit + authorPk}/${article.id}`}>
                <EditIcon />
              </Link>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default MiniArticleList;