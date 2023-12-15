import HomePage from './home';
import { NextSeo } from 'next-seo';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function App() {
  return (
    <>
      <NextSeo title="flycat" description="A nostr web client" />
      <HomePage />
    </>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
