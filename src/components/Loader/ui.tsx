import styles from './index.module.scss';
// Source: https://loading.io/css/

export const LoaderUI = () => {
  return (
    <div className={styles['lds-ellipsis']}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};
