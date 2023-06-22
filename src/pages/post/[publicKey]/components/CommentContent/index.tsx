import { Paths } from 'constants/path';
import { ContentType, MediaType, parseContent, parseMedia } from 'utils/content';

import Link from 'next/link';
import classNames from 'classnames';
import styles from './index.module.scss';
import { Avatar } from 'antd';

const CommentContent = ({ userMap, comment, onClick }) => {
  const checkClickFunction = onClick !== null;
  const transformContent = (content) => parseContent(content).map((item, key) => {
    if (item.type === ContentType.text) return <p key={key}>{item.value}</p>;
    if (item.type === ContentType.newline) return <br key={key} />;

    if (item.type === ContentType.link) {
      const { type, url } = parseMedia(item.value);

      if (type === MediaType.image) return <img src={url} alt="img" />;
      if (type === MediaType.video) return <video src={url} controls />;
      if (type === MediaType.link) return <a href={url} target="_blank">{url}</a>;
    }
  });

  return (
    <div className={classNames(styles.avatarAndContent, {
      [styles.cursor]: checkClickFunction
    })} onClick={checkClickFunction ? onClick : null}>
      <Avatar
        src={userMap.get(comment.pubkey)?.picture}
      />
      <span>{comment.pubkey}</span>
      <div className={styles.content}>
        <Link
          style={{ fontSize: '14px' }}
          href={Paths.user + comment.pubkey}
        >
          @{userMap.get(comment.pubkey)?.name || '__'}
        </Link>
        <span className={styles.time}>
          {new Date(comment.created_at).toLocaleTimeString()}
        </span>
        {transformContent(comment.content)}
      </div>
    </div>
  );
}

export default CommentContent;
