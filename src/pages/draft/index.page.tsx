import { Article } from 'core/nip/23';
import { useState } from 'react';
import { useDrafts } from './hooks';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { formatDate } from 'utils/time';

import PageTitle from 'components/PageTitle';
import styles from './index.module.scss';
import { Paths } from 'constants/path';
import { List } from 'antd';
import { delLocalSave } from 'pages/write/util';

const Draft: React.FC = () => {
  const [drafts, setDrafts] = useState<Article[]>([]);
  useDrafts(setDrafts);

  return (
    <BaseLayout>
      <Left>
        <PageTitle title={'My drafts'} />
        <div className={styles.panel}>
          <List
            bordered
            dataSource={drafts}
            renderItem={article => (
              <List.Item
                actions={[
                  <a
                    key="list-loadmore-edit"
                    href={Paths.write + `?did=${article.did}`}
                  >
                    Edit
                  </a>,

                  <a
                    key="list-loadmore-edit"
                    onClick={() => delLocalSave(article.did)}
                  >
                    Delete
                  </a>,
                ]}
              >
                <List.Item.Meta
                  title={
                    (article.title || 'No title') +
                    '(' +
                    formatDate(article.updated_at) +
                    ')'
                  }
                  description={article.content.slice(0, 100)}
                />
              </List.Item>
            )}
          />
        </div>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
};

export default Draft;

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
