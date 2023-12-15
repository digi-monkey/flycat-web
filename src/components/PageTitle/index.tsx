import styles from './index.module.scss';

export interface PageTitleProp {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}

const PageTitle: React.FC<PageTitleProp> = ({ icon, title, right }) => {
  return (
    <div className={styles.root}>
      <div className={styles.title}>
        {icon} {title}
      </div>
      <div>{right}</div>
    </div>
  );
};

export default PageTitle;
