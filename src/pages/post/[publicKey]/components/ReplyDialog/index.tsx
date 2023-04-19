import { RootState } from 'store/configureStore';
import { useSelector } from 'react-redux';
import { newComments } from '../../[articleId].page';
import { ImageUploader } from 'components/layout/PubNoteTextarea';
import { useEffect, useState } from 'react';
import { EventTags, EventETagMarker } from 'service/api';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { findNodeById, nonzero, submitReply } from '../../util';
import { Dialog, DialogContent, TextField, Button } from '@mui/material';

import styles from './index.module.scss';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import CommentContent from '../CommentContent';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined';

const ReplyDialog = ({ open, onClose, comment, userMap, worker, t }) => {
  const [reply, setReply] = useState('');
  const [image, setImage] = useState('');
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
      [EventTags.P, newComments?.pubkey, '', EventETagMarker.root],
      [EventTags.E, newComments?.id, '', EventETagMarker.reply]
    ], onClose);
  }

  const parseData = (val) => {
    if(!val) return;
    const state = val.replys && Object.keys(val.replys).length > 0 ? true : false;
    setNewComments(val); 
    setCheckReplys(state);

    if (state) {
      const ids = Object.keys(val.replys);
      worker?.subMsgByETags(ids)?.iterating({ 
        cb: (event) => {
          const tagIds = event.tags.filter(t => t[0] === EventTags.E).map(t => t[1] as string);
          for(const id of ids){
            if(tagIds.includes(id)){
              if (val.replys[id].replys) val.replys[id].replys[event.id] = event;
              else val.replys[id].replys = {[event.id]: event};
            }
          }
          setNewComments({...newComments, ...val});
        }
      });
    }
  }

  useEffect(() => { 
    if(open) parseData(comment);
  }, [open, comment]);

  const updateComment = (id) => {
    if (!newComments) return;

    const target = findNodeById(newComments, id);
    if (target) parseData(target);
  }

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
              <Button disabled={!reply.length} variant="contained" size='large' onClick={handleSubmit}>
                {t('articleRead.submit')}
              </Button>
            </div>
          </div>
        </div>
        { checkReplys && newComments && (
          <div className={styles.replys}>
            { Object.keys(newComments?.replys).map((item, key) => (
                <div key={key}>
                  <CommentContent 
                    onClick={() => updateComment(newComments?.replys[item].id)} 
                    comment={newComments?.replys[item]} 
                    userMap={userMap}
                  />
                  { isLoggedIn && (
                    <div className={styles.tools}>
                      <div className={styles.reply} onClick={() => updateComment(newComments?.replys[item].id)}>
                        <ModeCommentOutlinedIcon />
                        { nonzero(newComments.replys[item].replys) && <span>{ Object.keys(newComments.replys[item].replys).length }</span> }
                      </div>
                    </div>
                  )}
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
