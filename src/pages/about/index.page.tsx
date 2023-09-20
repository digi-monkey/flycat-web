import { useVersion } from 'hooks/useVersion';
import { useTranslation } from 'react-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/BaseLayout';

import styles from './index.module.scss';
import PubNoteTextarea from 'components/PubNoteTextarea';
import dynamic from 'next/dynamic';

function About({ commitId }) {
  const version = useVersion();
  const { t } = useTranslation();
  return (
    <BaseLayout>
      <Left>
        <div className={styles.about}>
          <h2>Flycat</h2>
          <p>
            Flycat is a new way to exit toxic internet. It represents a
            healthier social model built on Nostr protocol. There is no follower
            count, like button, private recommendation algorithm and all the
            other bullshit components found in modern social networks.
          </p>

          <h2>{t('setting.version')}</h2>
          <div>
            <a
              href={
                'https://github.com/digi-monkey/flycat-web/commit/' + commitId
              }
            >
              v{version}-{commitId}
            </a>
          </div>

          <h2>Open Source</h2>
          <a
            href="https://github.com/digi-monkey/flycat-web"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>

          <h2>Author</h2>
          <p>
            <a href="/user/45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a">
              ElectronicMonkey
            </a>
          </p>

          <h2>Join</h2>
          <p>
            We cherish open source and collaborative building. The only
            requirement to join building flycat is passion. There is plenty of{' '}
            <a href="https://github.com/digi-monkey/flycat-web/issues">
              issues
            </a>{' '}
            on the project, comment it if you are interested to help.{' '}
          </p>

          <h2>Looking for help?</h2>
          <p>
            Click the below input box to post your feedbacks with flycat hashtag
            on public, the author will see it and response.
          </p>
          <PubNoteTextarea initText="#flycat-feedback " />

          <br />
          <br />
          <br />
          <br />
        </div>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
}

export default dynamic(() => Promise.resolve(About), {
  ssr: false,
});

export const getStaticProps = async ({ locale }: { locale: string }) => {
  const commitId = process.env.REACT_APP_COMMIT_HASH;

  return {
    props: {
      commitId,
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};
