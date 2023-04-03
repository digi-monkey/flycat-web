import { Paths } from 'constants/path';
import { Editor } from './Editor';
import { Article } from 'service/nip/23';
import { connect } from 'react-redux';
import { UserMap } from 'service/type';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { SignEvent } from 'store/loginReducer';
import { useCallWorker } from 'hooks/useWorker';
import { ImageUploader } from 'components/layout/PubNoteTextarea';
import { useMatchMobile } from 'hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';
import { HashTags, TagObj } from '../hashTags/HashTags';
import { loginMapStateToProps } from 'pages/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getPublishedUrl, publish, setLocalSave } from './utils';
import { useArticle, useRestoreArticle, useWorker } from './hooks';
import { Alert, Button, Grid, OutlinedInput, Popover, Snackbar } from '@mui/material';

import Link from 'next/link';
import styles from './index.module.scss';

export function Write({
  isLoggedIn,
  signEvent,
}: {
  isLoggedIn: boolean;
  signEvent?: SignEvent;
}) {
  const router = useRouter();
  const isMobile = useMatchMobile();
  const myPublicKey = useReadonlyMyPublicKey();
  const articleId = router?.query?.articleId && decodeURIComponent(router?.query?.articleId as string);
  
  const { t } = useTranslation();
  const { worker } = useCallWorker();
  const { publicKey, did } = router.query;

  const [dirs, setDirs] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [toast, setToast] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [article, setArticle] = useState<Article>();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [content, setContent] = useState<string>('');
  const [hashTags, setHashTags] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [isRestore, setIsRestore] = useState(false);
  const [publishedToast, setPublishedToast] = useState(false);
  const [predefineHashTags, setPredefineHashTags] = useState<TagObj[]>([]);

  useWorker(setUserMap, setArticle, setIsRestore);
  useRestoreArticle(setArticle, setToast, isRestore);
  useArticle(article, setTitle, setSummary, setContent, setImage, setSlug, setDirs, setHashTags, setPredefineHashTags);

  return (
    <div className={styles.write}>
      <div className={styles.writeHeaderBar}>
        <Link href={Paths.home}>
          <img src="/logo512.png" alt="LOGO" />
        </Link>
        <div className={styles.btnGroup}>
          {
            !articleId && <Button 
              variant="contained"
              color='secondary'
              size='small'
              disabled={ title === '' && content === '' }
              onClick={() => { 
                setLocalSave({ 
                  title, slug, dirs, image, summary, content, hashTags, 
                  did: articleId || did,
                  updated_at: Math.floor(Date.now() / 1000)
                });
                setSaveToast(true);
              }}
            >
              {t('blogWrite.btn.save')}
            </Button>
          }
          <Button 
            disabled={ title === '' && content === '' }
            onClick={event => setAnchorEl(event.currentTarget)}
            variant="contained"
            color="primary" 
            size='small'
            aria-describedby={Boolean(anchorEl) ? 'simple-popover' : undefined}
          >
            {t('blogWrite.btn.publish')}
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
                {t('blogWrite.form.coverImage')}
              </Grid>
              <Grid item xs={9}>
                <div className={styles.image}>
                  {image ? <img src={image} alt="head image" /> : <ImageUploader onImgUrls={url => setImage(url[0])} />}
                </div>
              </Grid>
              <Grid item xs={3}>
                {t('blogWrite.form.summary')}
              </Grid>
              <Grid item xs={9}>
                <OutlinedInput
                  size='small'
                  value={summary}
                  onChange={event => setSummary(event.target.value)}
                  placeholder={`${t('blogWrite.form.summary')}`}
                  fullWidth
                ></OutlinedInput>
              </Grid>
              <Grid item xs={3}>
                {t('blogWrite.form.slug')}
              </Grid>
              <Grid item xs={9}>
                <OutlinedInput
                  size='small'
                  value={slug}
                  onChange={event => setSlug(event.target.value)}
                  placeholder={`${t('blogWrite.form.slugPlaceholder')}`}
                  fullWidth
                ></OutlinedInput>
              </Grid>
              <Grid item xs={3}>
                {t('blogWrite.form.dir')}
              </Grid>
              <Grid item xs={9}>
                <OutlinedInput
                  size='small'
                  value={dirs}
                  onChange={event => setDirs(event.target.value)}
                  placeholder={`${t('blogWrite.form.dirPlaceholder')}`}
                  fullWidth
                ></OutlinedInput>
              </Grid>
              <Grid item xs={3}>
                {t('blogWrite.form.tag')}
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
                  {t('blogWrite.btn.cancel')}
                </Button>  
              </Grid>
              <Grid item xs={6} alignItems="center">
                <Button
                  onClick={() => publish({
                    did: articleId || did,
                    title, 
                    slug, 
                    image, 
                    summary, 
                    content, 
                    hashTags
                  }, dirs, signEvent, worker, router, setPublishedToast,
                  getPublishedUrl(publicKey, articleId, myPublicKey, slug) )} 
                  variant="contained" 
                  color="primary" 
                  size='small'
                >
                  {t('blogWrite.btn.publish')}
                </Button>
              </Grid>
            </Grid>
          </Popover>
        </div>
      </div>
      <div className={styles.main}>
        <div className={styles.title}>
          <OutlinedInput
            autoFocus
            fullWidth
            placeholder={`${t('blogWrite.main.titlePlaceholder')}`}
            value={title}
            onChange={event => setTitle(event.target.value)}
          ></OutlinedInput>
        </div>
        {
          isMobile !== undefined && (
            <Editor 
              style={{}} 
              value={content} 
              onText={setContent} 
              className={styles.editor} 
              view={ isMobile ? { menu: true, md: true, html: false } : {}} 
            />  
          )
        }
      </div>
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
          {t('blogWrite.tipsy.restore')}
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
          {t('blogWrite.tipsy.success.save')}
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
          {t('blogWrite.tipsy.success.publish')}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default connect(loginMapStateToProps)(Write);

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
});