import { Article } from 'core/nip/23';
import { useState } from 'react';
import { useDrafts } from './hooks';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { formatDate } from 'utils/time';

import PageTitle from 'components/PageTitle';
import { Paths } from 'constants/path';
import { delLocalSave } from 'pages/write/util';
import { Button } from 'components/shared/ui/Button';

const Draft: React.FC = () => {
  const [drafts, setDrafts] = useState<Article[]>([]);
  useDrafts(setDrafts);

  return (
    <BaseLayout>
      <Left>
        <PageTitle title={'My drafts'} />
        <div className="px-2">
          {drafts.map(article => (
            <div
              key={article.pubKey + article.id}
              className="flex justify-between align-middle px-2 py-1 mt-4"
            >
              <div className="flex flex-col gap-2">
                <div className="font-bold">
                  {(article.title || 'No title') +
                    '(' +
                    formatDate(article.updated_at) +
                    ')'}
                </div>
                <div className=" text-neutral-700 text-sm">
                  article.content.slice(0, 100)
                </div>
              </div>
              <div className="flex align-middle justify-end">
                <Button
                  variant={'link'}
                  onClick={() =>
                    (window.location.href = Paths.write + `?did=${article.did}`)
                  }
                >
                  Edit
                </Button>

                <Button
                  variant={'link'}
                  onClick={() => delLocalSave(article.did)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
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
