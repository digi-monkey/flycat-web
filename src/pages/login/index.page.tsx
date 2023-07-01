import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import LoginCard from './LoginCard';

export function Login() {
  return (
    <BaseLayout silent={true}>
      <Left>
        <LoginCard />
      </Left>
      <Right></Right>
    </BaseLayout>
  );
}

export default Login;

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
