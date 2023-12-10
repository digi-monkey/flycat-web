import styles from './small.module.scss';
// Source: https://loading.io/css/

export const SmallLoaderUI = () => {
  return (
    <div className={styles['lds-facebook']}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};
