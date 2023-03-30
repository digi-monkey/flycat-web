import { Paths } from 'constants/path';
import { connect } from 'react-redux';
import { UserMap } from 'service/type';
import { TagItem } from './hashTags/TagItem';
import { Article } from 'service/nip/23';
import { useState } from 'react';
import { PublicKey } from 'service/api';
import { useRouter } from 'next/router';
import { useWorker } from './hooks';
import { ProfileAvatar } from 'components/layout/msg/TextMsg';
import { useTranslation } from 'next-i18next';
import { loginMapStateToProps } from 'pages/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/layout/BaseLayout';

import Link from 'next/link';
import Collection from './components/Collection';
import MiniArticleList from './components/MiniArticleList/index';

export const PersonalBlog = ({ isLoggedIn, signEvent }) => {
  const { t } = useTranslation();
  const myPublicKey = useReadonlyMyPublicKey();
  const { publicKey } = useRouter().query as { publicKey: PublicKey };

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [articles, setArticles] = useState<Article[]>([]);
  
  useWorker(publicKey, isLoggedIn, myPublicKey, setUserMap, setArticles);
  
  return (
    <BaseLayout>
      <Left>
        <div style={{ marginBottom: '20px', height: '100%' }}>
          <ProfileAvatar
            picture={userMap.get(publicKey)?.picture}
            name={publicKey}
          />
          <span style={{ marginLeft: '10px' }}>
            <Link style={{ textDecoration: 'underline', marginRight: '5px' }} href={Paths.user+publicKey}>
              @{userMap.get(publicKey)?.name || '__'}{' '}
            </Link>
          </span>
        </div>

        <Collection 
          title={t('blog.collection')} 
          articles={articles} 
          directorys={articles.filter(a => a.dirs != null).map(a => a.dirs!)} 
        />
        <MiniArticleList 
          title={t('blog.articles')} 
          articles={articles} 
          isOwner={publicKey === myPublicKey} 
          authorPk={publicKey} 
        />
      </Left>
      <Right>
        <div style={{ marginTop: '40px' }}>
          {articles
            .map(article => article.hashTags)
            .flat(Infinity)
            .filter(t => typeof t === 'string')
            .map((t, key) => (
              <TagItem key={key} tag={t as string} />
            ))}
        </div>
      </Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(PersonalBlog);

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
});

export const getStaticPaths = () => ({ paths: [], fallback: true });