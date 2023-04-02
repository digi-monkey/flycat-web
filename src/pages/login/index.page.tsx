import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import LoginCard from './LoginCard';
import { BaseLayout, Left } from 'components/layout/BaseLayout';

export function Login() {
  return (
    <BaseLayout silent={true}>
      <Left>
	<LoginCard />
      </Left>
    </BaseLayout>
  );
}

export default Login;

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
