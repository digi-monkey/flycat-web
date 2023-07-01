import { connect } from 'react-redux';
import { loginMapStateToProps } from 'pages/helper';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Write } from 'pages/write/index.page';

export default connect(loginMapStateToProps)(Write);

export const getStaticPaths = async () => ({ paths: [], fallback: true });

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
});
