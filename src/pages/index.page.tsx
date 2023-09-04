import HomePage from './home';
import { NextSeo } from 'next-seo';
import {serverSideTranslations} from "next-i18next/serverSideTranslations";
import { initConfig } from '@joyid/nostr';

export default function App() {
  initConfig({
    // your app name
    name: 'flycat',
    // your app logo,
    logo: 'https://flycat.club/logo512.png',
    // optional, default to 'https://poc.joyid.dev'
    // joyidAppURL: 'https://poc.joyid.dev',
    
  });
    
  return (
    <>
      <NextSeo title='flycat' description='A nostr web client' />
      <HomePage />
    </>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
})
