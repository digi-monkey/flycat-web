import styles from './index.module.scss';

export const Book = ({ title, count, time }) => (
  <div className={styles.item} onClick={() => alert('wait for me, working on it')}>
    <div className={styles.title}>{title}</div>
    <div className={styles.count}>{`(${count})`}</div>
    <div className={styles.time}>
      {time ? new Date(time * 1000).toLocaleDateString() : 'some times ago'}
    </div>
  </div>
);