import { NextSeo } from 'next-seo';
import styles from './index.module.scss';

export default function NotFoundPage() {
  return (
    <>
      <NextSeo title='404 Page Not Found' description='Page not found' />
      <div className={styles.wrapper}>
        <div className={styles.title}>
          4
          <span role="img" aria-label="Crying Face">
            😢
          </span>
          4
        </div>
        <p>Page not found.</p>
      </div>
    </>
  );
}
