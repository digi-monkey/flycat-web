import { RootState } from 'store/configureStore';
import { dontLikeComment, nonzero, parseLikeData, submitReply } from '../../util';
import { useSelector } from 'react-redux';
import { newComments } from '../../[articleId].page';
import { ImageUploader } from 'components/layout/PubNoteTextarea';
import { useEffect, useState } from 'react';
import { EventTags, TagsMarker } from 'service/api';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { Dialog, DialogContent, TextField, Button } from '@mui/material';

import styles from './index.module.scss';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import CommentContent from '../CommentContent';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined';

const ReplyDialog = ({ open, onClose, comment, userMap, worker, t }) => {
  const [reply, setReply] = useState('');
  const [image, setImage] = useState('');
  const [childEventId, setChildEventId] = useState('');
  const [newComments, setNewComments] = useState<newComments>();
  const [checkReplys, setCheckReplys] = useState(false);

  const myPublicKey = useReadonlyMyPublicKey();
  const signEvent = useSelector((state: RootState) => state.loginReducer.signEvent);
  const isLoggedIn = useSelector((state: RootState) => state.loginReducer.isLoggedIn);

  const handleSubmit = () => {
    if(!isLoggedIn) {
      Swal.fire({
        icon: 'error',
        text: t("comment.login"),
      });
      return;
    }

    let content = reply;
    if (image) content = (content + "\n" + image).trim();

    submitReply(worker, signEvent, content, myPublicKey, [
      [EventTags.P, newComments?.pubkey, '', TagsMarker.root],
      [EventTags.E, newComments?.id, '', TagsMarker.reply]
    ], onClose);
  }

  const parseData = (val) => {
    const state = val.replys && Object.keys(val.replys).length > 0 ? true : false;

    setNewComments(val);
    setCheckReplys(state);
  }

  useEffect(() => { open && parseData(comment); }, [open]);

  useEffect(() => {
    if (!newComments?.replys) return;
    
    const target = newComments?.replys[childEventId];
    if (target) parseData(target);
  }, [childEventId]);

  return (
    <Dialog className={styles.popupDialog} open={open} onClose={onClose}>
      <DialogContent>
        { newComments && <CommentContent comment={newComments} userMap={userMap} onClick={null} /> }
        <div className={styles.commentBox}>
          <span className={styles.picture}>{t("comment.me")}</span>
          <div className={styles.group}>
            <TextField
              className={styles.textarea}
              multiline
              minRows={3}
              placeholder={t('comment.placeholder') as string}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            { image && <div className={styles.image}>
                <img src={image} alt="replyImage" />
                <HighlightOffIcon onClick={() => setImage('')} />
              </div> 
            }
            <div className={styles.commentFooter}>
              <div className={styles.icons}>
                <ImageUploader onImgUrls={url => setImage(url[0])} />
              </div>
              <Button variant="contained" size='large' onClick={handleSubmit}>
                {t('articleRead.submit')}
              </Button>
            </div>
          </div>
        </div>
        { checkReplys && newComments && (
          <div className={styles.replys}>
            { Object.keys(newComments?.replys).map((item, key) => (
                <div key={key}>
                  <CommentContent onClick={() => setChildEventId(newComments?.replys[item].id)} comment={newComments?.replys[item]} userMap={userMap} />
                  { isLoggedIn && <div className={styles.tools}>
                      <div className={styles.reply} onClick={() => setChildEventId(newComments?.replys[item].id)}>
                        <ModeCommentOutlinedIcon />
                        { nonzero(newComments.replys[item].replyss) && <span>{ Object.keys(newComments.replys[item].replys).length }</span> }
                      </div>
                      <div className={styles.like} onClick={ () => newComments.isLike ? dontLikeComment(worker, signEvent, newComments.id, myPublicKey) : parseLikeData(newComments, worker, signEvent, myPublicKey) }>
                        <FavoriteBorderIcon className={newComments.isLike ? styles.like : ''} />
                        { newComments.likes && nonzero(newComments.likes[item].likes) && <span>{ Object.keys(newComments.likes[item].likes).length }</span> }
                      </div>
                    </div>
                  }
                </div>
              )
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ReplyDialog;
