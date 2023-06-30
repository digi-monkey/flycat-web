import HomePage from './home';
import { NextSeo } from 'next-seo';
import {serverSideTranslations} from "next-i18next/serverSideTranslations";
import { message } from 'antd';

export default function App() {
  const [contextHolder] = message.useMessage();
  return (
    <>
      <NextSeo title='flycat' description='A nostr web client' />
      {contextHolder}
      <HomePage />
    </>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
})
