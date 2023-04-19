import { red } from '@mui/material/colors';
import { Paths } from 'constants/path';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material';
import { formatDate } from 'service/helper';
import { useTimeSince } from 'hooks/useTimeSince';
import { payLnUrlInWebLn } from 'service/lighting/lighting';
import { getDateBookName } from 'hooks/useDateBookData';
import Button, { ButtonProps } from '@mui/material/Button';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';

import Link from 'next/link';
import styles from './index.module.scss';
import EditIcon from '@mui/icons-material/Edit';
import ReactMarkdown from 'react-markdown';
import ElectricBoltOutlinedIcon from '@mui/icons-material/ElectricBoltOutlined';

const LikedButton = styled(Button)<ButtonProps>(({ theme }) => ({
  color: theme.palette.getContrastText(red[500]),
  backgroundColor: red[500],
  '&:hover': {
    backgroundColor: red[700],
  },
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '10px 20px',
}));

const PostContent = ({ article, publicKey, userMap, articleId, content, t }) => {
  const theme = useTheme();
  const myPublicKey = useReadonlyMyPublicKey();

  return (
    <div className={styles.postContent}>
      <div className={styles.postHeader}>
        {article?.image && (
          <img src={article.image} className={styles.banner} alt={article?.title} />
        )}
        <div className={styles.postTitleInfo}>
          <div className={styles.title}>
            {article?.title}
          </div>
          <div className={styles.name}>
            <Link href={Paths.user + publicKey}>
              <span style={{ marginRight: '5px' }}>
                {userMap.get(publicKey)?.name}
              </span>
            </Link>
            {article?.published_at && (
              <span style={{ margin: '0px 10px' }}>
                {formatDate(article?.published_at)}
              </span>
            )}

            {publicKey === myPublicKey && (
              <Link
                href={`${Paths.edit + publicKey}/${articleId}`}
                style={{ color: 'gray' }}
              >
                {' '}
                ~ <EditIcon style={{ height: '14px', color: 'gray' }} />
              </Link>
            )}
          </div>
        </div>

        <div className={styles.postTags}>
          {article?.hashTags?.flat(Infinity).map((t, key) => (
            <span
              key={key}
              style={{ background: theme.palette.secondary.main }}
            >
              {t}
            </span>
          ))}
        </div>

        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => (
              <div
                style={{ fontSize: '20px', fontWeight: 'bold' }}
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <div
                style={{ fontSize: '18px', fontWeight: 'bold' }}
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <div
                style={{ fontSize: '16px', fontWeight: 'bold' }}
                {...props}
              />
            ),
            h4: ({ node, ...props }) => (
              <div
                style={{ fontSize: '14px', fontWeight: 'bold' }}
                {...props}
              />
            ),
            img: ({ node, ...props }) => (
              <img style={{ width: '100%' }} {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                style={{
                  borderLeft: `5px solid ${theme.palette.primary.main}`,
                  padding: '0.5rem',
                  margin: '0 0 1rem',
                  fontStyle: 'italic',
                }}
                {...props}
              />
            ),
            code: ({ node, inline, ...props }) => {
              return inline ? (
                <span
                  style={{
                    background: theme.palette.secondary.main,
                    padding: '5px',
                  }}
                  {...props}
                />
              ) : (
                <div
                  style={{
                    background: theme.palette.secondary.main,
                    padding: '20px',
                    borderRadius: '5px',
                  }}
                  {...props}
                />
              );
            },
          }}
        >
          {content ?? ''}
        </ReactMarkdown>
      </div>
      <div className={styles.info}>
        <div className={styles.author}>
          <div className={styles.picture}>
            <Link href={Paths.user + publicKey}>
              <img src={userMap.get(publicKey)?.picture} alt={userMap.get(publicKey)?.name} />
            </Link>
          </div>

          <div className={styles.name}>
            <Link href={Paths.user + publicKey}>
              {userMap.get(publicKey)?.name}
            </Link>
          </div>

          <div>
            <LikedButton
              onClick={async () => {
                const lnUrl =
                  userMap.get(publicKey)?.lud06 ||
                  userMap.get(publicKey)?.lud16;
                if (lnUrl == null) {
                  return alert('no ln url, please tell the author to set up one.');
                }
                await payLnUrlInWebLn(lnUrl);
              }}
            >
              <ElectricBoltOutlinedIcon />
              <span style={{ marginLeft: '5px' }}>
                {'like the author'}
              </span>
            </LikedButton>
          </div>

          <div className={styles.collected} style={{ background: theme.palette.secondary.main }}>
            <span className={styles.title}>{'collected in'}</span>
            <span className={styles.datetime} style={{ background: theme.palette.secondary.main }}>
              {getDateBookName( article?.published_at || article?.updated_at || 0 )}
            </span>
            {article?.dirs?.map((t, key) => (
              <span
                key={key}
                className={styles.dirs}
                style={{ background: theme.palette.secondary.main }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.updated_at}>
        <span>
          {t('articleRead.lastUpdatedAt') + ' '}
          {useTimeSince(article?.updated_at ?? 10000)}
        </span>
      </div>
    </div>
  )
}

export default PostContent;
