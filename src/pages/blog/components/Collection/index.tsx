import { Book } from './Book';
import { useDateBookData } from 'hooks/useDateBookData';

import styles from './index.module.scss';

const Collection = ({ title, directorys, articles }) => (
  <div className={styles.collection}>
    <h3>{title}</h3>
    <div className={styles.list}>
      {useDateBookData(articles).map((book, key) => (
        <Book key={key} title={book.title} count={book.count} time={book.time} />
      ))}
      {directorys
        .map(dirs => dirs[0])
        .filter((value, index, array) => array.indexOf(value) === index)
        .map((dir, key) => (
          <Book
            key={key}
            title={dir}
            count={ articles.filter(a => a.dirs && a.dirs[0] === dir).length }
            time={ articles.filter(a => a.dirs && a.dirs[0] === dir)[0].published_at }
          />
        ))}
    </div>
  </div>  
);

export default Collection;