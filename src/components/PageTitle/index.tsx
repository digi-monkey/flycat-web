import styles from './index.module.scss';

export interface PageTitleProp {
  title: string;
}

const PageTitle: React.FC<PageTitleProp> = ({ title }) => {
  return <div className={styles.root}>{title}</div>;
};

export default PageTitle;
