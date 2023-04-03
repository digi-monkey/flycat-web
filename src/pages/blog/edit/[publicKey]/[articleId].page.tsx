import { connect } from 'react-redux';
import { Write } from 'pages/blog/write/index.page';
import { loginMapStateToProps } from 'pages/helper';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default connect(loginMapStateToProps)(Write);

export const getStaticPaths = async () => ({ paths: [], fallback: true });

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
});