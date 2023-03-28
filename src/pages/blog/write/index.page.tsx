import { Paths } from 'constants/path';
import { Editor } from '../Editor';
import { Article } from 'service/nip/23';
import { connect } from 'react-redux';
import { UserMap } from 'service/type';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { SignEvent } from 'store/loginReducer';
import { useCallWorker } from 'hooks/useWorker';
import { ImageUploader } from 'components/layout/PubNoteTextarea';
import { HashTags, TagObj } from '../hashTags/HashTags';
import { loginMapStateToProps } from 'pages/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { Publish, ArrowBack, SaveAlt, History } from '@mui/icons-material';
import { getPublishedUrl, publish, setLocalSave } from './utils';
import { useArticle, useRestoreArticle, useWorker } from './hooks';
import { Alert, Button, Grid, OutlinedInput, Popover, Snackbar } from '@mui/material';

import styles from './index.module.scss';

export function Write({
  isLoggedIn,
  signEvent,
}: {
  isLoggedIn: boolean;
  signEvent?: SignEvent;
}) {
  const router = useRouter();
  const myPublicKey = useReadonlyMyPublicKey();
  const { worker } = useCallWorker();
  const { publicKey, articleId } = router.query;
  
  const [dir, setDir] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [toast, setToast] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [article, setArticle] = useState<Article>();
  const [draft, setDraft] = useState<Article>();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [content, setContent] = useState<string>('');
  const [hashTags, setHashTags] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [isRestore, setIsRestore] = useState(false);
  const [publishedToast, setPublishedToast] = useState(false);
  const [predefineHashTags, setPredefineHashTags] = useState<TagObj[]>([]);

  useWorker(setUserMap, setArticle, setIsRestore);
  useRestoreArticle(setDraft, setToast, isRestore);
  useArticle(article, setTitle, setSummary, setContent, setImage, setSlug, setDir, setHashTags, setPredefineHashTags);

  return (
    <div className={styles.write}>
      <div className={styles.writeHeaderBar}>
        <div className={styles.title}>
          <OutlinedInput
            fullWidth
            placeholder="Please enter the title of your article"
            value={title}
            onChange={event => setTitle(event.target.value)}
          ></OutlinedInput>
        </div>
        <div className={styles.btnGroup}>
          <Button
            onClick={() => router.push({ pathname: `${Paths.blog}/${myPublicKey}`})}
            variant="contained"
            color='secondary'
            size='small'
          ><ArrowBack />Cancel</Button>
          <Button 
            variant="contained"
            color='error'
            size='small'
            onClick={() => { 
              if (draft) setArticle(draft)
              else {
                setLocalSave({ title, slug, dir, image, summary, content, hashTags}); 
                setSaveToast(true);
              }
            }}
          >
            {draft ? <><History />Recovery</> : <><SaveAlt />Save draft</>}
          </Button>
          <Button 
            onClick={event => setAnchorEl(event.currentTarget)}
            variant="contained"
            color="primary" 
            size='small'
            aria-describedby={Boolean(anchorEl) ? 'simple-popover' : undefined}
          >
            <Publish />Publish
          </Button>
          <Popover 
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            className={styles.prePublish}
          >
            <Grid container spacing={2}>
              <Grid item xs={3}>
                Cover Image
              </Grid>
              <Grid item xs={9}>
                <div className={styles.image}>
                  {image ? <img src={image} alt="head image" /> : <ImageUploader onImgUrls={url => setImage(url[0])} />}
                </div>
              </Grid>
              <Grid item xs={3}>
                Summary
              </Grid>
              <Grid item xs={9}>
                <OutlinedInput
                  size='small'
                  value={summary}
                  onChange={event => setSummary(event.target.value)}
                  placeholder="summary"
                  fullWidth
                ></OutlinedInput>
              </Grid>
              <Grid item xs={3}>
                Slug
              </Grid>
              <Grid item xs={9}>
                <OutlinedInput
                  size='small'
                  value={slug}
                  onChange={event => setSlug(event.target.value)}
                  placeholder="(optionally) slug, aka article_id, can not be changed after. just leave it blank if you don't understand it."
                  fullWidth
                ></OutlinedInput>
              </Grid>
              <Grid item xs={3}>
                Dir
              </Grid>
              <Grid item xs={9}>
                <OutlinedInput
                  size='small'
                  value={dir}
                  onChange={event => setDir(event.target.value)}
                  placeholder="(optionally) virtual path of the article, split with '/', eg: dir1/dir2/dir3"
                  fullWidth
                ></OutlinedInput>
              </Grid>
              <Grid item xs={3}>
                Tag
              </Grid>
              <Grid item xs={9}>
                <div className={styles.tags}>
                  <HashTags 
                    predefineTags={predefineHashTags}
                    callback={tags => setHashTags(tags.map(t => t.id))}
                  />
                </div>
              </Grid>
              <Grid item xs={6} alignItems="center">
                <Button 
                  variant="outlined" 
                  color='error' 
                  size='small' 
                  onClick={() => setAnchorEl(null)}
                >
                  Cancel
                </Button>  
              </Grid>
              <Grid item xs={6} alignItems="center">
                <Button
                  onClick={() => publish({
                    title, 
                    slug, 
                    image, 
                    summary, 
                    content, 
                    hashTags
                  }, dir, signEvent, worker, router, setPublishedToast,
                  getPublishedUrl(publicKey, articleId, myPublicKey, slug) )} 
                  variant="contained" 
                  color="primary" 
                  size='small'
                >
                  <Publish />Publish
                </Button>
              </Grid>
            </Grid>
          </Popover>
        </div>
      </div>
      <Editor value={content} onText={setContent} className={styles.editor} style={{}} view={{}} />
      <Snackbar 
        open={toast} 
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        autoHideDuration={4000}
        onClose={() => setToast(false)}
      >
        <Alert severity="success">
          Find a local article draft, click the blue button to restore
        </Alert>
      </Snackbar>
      <Snackbar
        open={saveToast}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        autoHideDuration={4000}
        onClose={() => setSaveToast(false)}
      >
        <Alert severity="success">
          Save successfully
        </Alert>
      </Snackbar>
      <Snackbar
        open={publishedToast}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        autoHideDuration={4000}
        onClose={() => setPublishedToast(false)}
      >
        <Alert severity="success">
          Published successfully
        </Alert>
      </Snackbar>
    </div>
  );
}

export default connect(loginMapStateToProps)(Write);
