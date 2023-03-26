import { BlogFeeds } from './feed';
import { BaseLayout, Left, Right } from 'components/layout/BaseLayout';
import {serverSideTranslations} from "next-i18next/serverSideTranslations";

export default function BlogFeedPage() {
  return (
    <BaseLayout>
      <Left>
        <BlogFeeds />
      </Left>
      <Right></Right>
    </BaseLayout>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
})