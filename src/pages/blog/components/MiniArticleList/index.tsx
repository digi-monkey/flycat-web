import { Paths } from "constants/path";
import { Article } from "service/nip/23";
import { History } from "@mui/icons-material";
import { useState } from "react";
import { useDrafts } from "./hooks";
import { useTimeSince } from "hooks/useTimeSince";
import { useTranslation } from "react-i18next";

import Link from "next/link";
import styles from './index.module.scss';
import EditIcon from '@mui/icons-material/Edit';

const MiniArticleList = ({ title, articles, authorPk, isOwner }) => {
  const { t } = useTranslation();
  const [drafts, setDrafts] = useState<Article[]>();
  const Updated = ({ article }) => <span className={styles.updated}>{useTimeSince(article.updated_at)}</span>;

  useDrafts(setDrafts);
  
  return (
    <>
      <h3 className={styles.articlesListTitle}>{title}</h3>
      <div className={styles.articleList}>
        {isOwner && drafts?.map((article, key) => (
          <div className={styles.articleItem} key={key}>
            <div className={styles.article}>
              <Link
                href={`${Paths.write}?title=${article.title}`}
                target="_blank"
                rel="noreferrer"
              >
                {article.title}
              </Link>
              <span className={styles.badge}>{t('blog.draft')}</span>
              <Updated article={article} />
            </div>

            <Link className={styles.icon} href={`${Paths.write}?title=${article.title}`}>
              <History />
            </Link>
          </div>
        ))}
        
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