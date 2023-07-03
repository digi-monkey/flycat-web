import { useVersion } from 'hooks/useVersion';
import { useTranslation } from 'react-i18next';
import styles from './index.module.scss';
import { Divider } from 'antd';

export default function About({ commitId }: { commitId: string }) {
  const version = useVersion();
  const { t } = useTranslation();
  return (
    <div className={styles.about}>
      <div>
        {t('setting.version')}v{version}-{commitId}
      </div>

      <Divider></Divider>

      <div>
        Flycat is an comprehensive <strong>Open Source</strong> project 😊
      </div>
      <div>feel free to join us and contribute to this software</div>
      <div>
        Visit our{' '}
        <a
          href="https://github.com/digi-monkey/flycat-web"
          target="_blank"
          rel="noreferrer"
        >
          GitHub repository
        </a>
        {' '} to get involved and make a meaningful impact.
      </div>
      <div>Together let&apos;s shape the future of Flycat!</div>
    </div>
  );
}
