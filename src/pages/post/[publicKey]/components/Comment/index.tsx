import { Event } from 'service/api';
import { UserMap } from 'service/type';
import { nonzero } from '../../util';
import { RootState } from 'store/configureStore';
import { CallWorker } from 'service/worker/callWorker';
import { newComments } from '../../[articleId].page';
import { useSelector } from 'react-redux';
import { useEffect, useRef } from 'react';

import styles from './index.module.scss';
import CommentContent from '../CommentContent';
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined';

export interface CommentProps {
  comments: newComments[];
  userMap: UserMap;
  worker?: CallWorker;
  setReplyId: (id: string) => void;
  notLike: (id: string) => void;
  like: (comment: newComments) => void;
  setReplyComment: (comment: newComments) => void;
}

const Comment = ({ comments, userMap, worker, setReplyId, setReplyComment, like, notLike }: CommentProps) => {
  const commentsRef = useRef<Event[]>([]);
  const isLoggedIn = useSelector((state: RootState) => state.loginReducer.isLoggedIn);

  useEffect(() => {
    const prevComments = commentsRef.current;
    const newComments = comments.filter(
      comment => !prevComments.map(p => p.id).includes(comment.id),
    );
    commentsRef.current = comments;

    const pks = newComments.map(a => a.pubkey);
    if (pks.length === 0) return;
    worker?.subMetadata(pks, undefined, 'article-data');
  }, [comments]);

  return (
    <ul className={styles.comments}>
      {comments && comments.map(comment => (
        <li 
          key={comment.id} 
          className={styles.commentItem} 
          onClick={() => { 
            setReplyComment(comment);
            setReplyId(comment.id);
          }}>
          <CommentContent 
            userMap={userMap} 
            comment={comment} 
            onClick={() => {
              setReplyComment(comment);
              setReplyId(comment.id)
            }}
          />
          <div className={styles.tools}>
            <div className={styles.reply}>
              <ModeCommentOutlinedIcon />
              { nonzero(comment.replys) && <span>{ Object.keys(comment.replys).length }</span> }
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default Comment;
