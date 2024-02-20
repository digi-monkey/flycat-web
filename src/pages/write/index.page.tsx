import { Paths } from 'constants/path';
import { connect } from 'react-redux';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { SignEvent } from 'store/loginReducer';
import { useCallWorker } from 'hooks/useWorker';
import { ImageUploader } from 'components/ImageUploader';
import { useTranslation } from 'react-i18next';
import { HashTags, TagObj } from 'components/HashTags';
import { loginMapStateToProps } from 'pages/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { publish, setLocalSave } from './util';
import { useArticle, useRestoreArticle, useWorker } from './hooks';
import { Button, Input, Modal } from 'antd';
import { Article } from 'core/nip/23';
import { UserMap } from 'core/nostr/type';
import { MdEditor } from 'components/Editor';
import { getDraftId } from 'utils/common';
import RelaySelector from 'components/RelaySelector';

import Link from 'next/link';
import styles from './index.module.scss';
import { noticePubEventResult } from 'components/PubEventNotice';
import { useToast } from 'components/shared/ui/Toast/use-toast';

export function Write({ signEvent }: { signEvent?: SignEvent }) {
  const router = useRouter();
  const { toast } = useToast();
  const myPublicKey = useReadonlyMyPublicKey();
  const articleId =
    router?.query?.articleId &&
    decodeURIComponent(router?.query?.articleId as string);

  const { t } = useTranslation();
  const { worker } = useCallWorker();
  const { publicKey, did } = router.query;

  const [dirs, setDirs] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [article, setArticle] = useState<Article>();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [content, setContent] = useState<string>('');
  const [hashTags, setHashTags] = useState<string[]>([]);
  const [isRestore, setIsRestore] = useState(false);
  const [predefineHashTags, setPredefineHashTags] = useState<TagObj[]>([]);

  const [openPublishModal, setOpenPublishModal] = useState(false);

  useWorker(setUserMap, setArticle, setIsRestore);
  useRestoreArticle(setArticle, toast, t('blogWrite.tipsy.restore'), isRestore);
  useArticle(
    article,
    setTitle,
    setSummary,
    setContent,
    setImage,
    setSlug,
    setDirs,
    setHashTags,
    setPredefineHashTags,
  );

  const onPublish = async () => {
    const handler = await publish(
      {
        did: articleId || did,
        title,
        slug,
        image,
        summary,
        content,
        hashTags,
      },
      dirs,
      signEvent,
      worker!,
    );
    if (handler) {
      noticePubEventResult(
        toast,
        worker!.relays.length,
        handler,
        (eventId: string) => {
          const pathname = slug
            ? `${Paths.post + myPublicKey}/${encodeURIComponent(slug)}`
            : `${Paths.event}/${eventId}/`;
          router.push({ pathname });
        },
      );
      setOpenPublishModal(false);
      toast({
        title: t('blogWrite.tipsy.success.publish') as string,
        status: 'success',
      });
    }
  };

  return (
    <div className={styles.write}>
      <div className={styles.writeHeaderBar}>
        <Link href={Paths.home}>
          <img src="/logo/web/Flycat-logo-vt-dark.svg" alt="LOGO" />
        </Link>
        <div className={styles.btnGroup}>
          {!articleId && (
            <Button
              disabled={title === '' && content === ''}
              onClick={() => {
                setLocalSave({
                  title,
                  slug,
                  dirs,
                  image,
                  summary,
                  content,
                  hashTags,
                  did: did || getDraftId(),
                  updated_at: Math.floor(Date.now() / 1000),
                });

                toast({
                  title: t('blogWrite.tipsy.success.save') as string,
                  status: 'success',
                });
              }}
            >
              {t('blogWrite.btn.save')}
            </Button>
          )}
          <Button
            disabled={title === '' && content === ''}
            onClick={() => setOpenPublishModal(true)}
          >
            {t('blogWrite.btn.publish')}
          </Button>

          <Modal
            title="Publish settings"
            open={openPublishModal}
            onOk={onPublish}
            onCancel={() => setOpenPublishModal(false)}
            okText={t('blogWrite.btn.publish')}
            cancelText={t('blogWrite.btn.cancel')}
          >
            <div className={styles.prePublish}>
              <div>
                Select Relays
                <RelaySelector />
              </div>

              <div>
                {t('blogWrite.form.coverImage')}
                <div className={styles.image}>
                  {image.length > 0 ? (
                    <div className={styles.pic}>
                      <img src={image} alt="banner" />
                      <button
                        onClick={() => setImage('')}
                        className={styles.overlayButton}
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <ImageUploader onImgUrls={url => setImage(url[0])} />
                  )}
                </div>
              </div>

              <div>
                {t('blogWrite.form.summary')}
                <Input
                  value={summary}
                  onChange={event => setSummary(event.target.value)}
                  placeholder={`${t('blogWrite.form.summary')}`}
                />
              </div>

              <div>
                {t('blogWrite.form.slug')}
                <Input
                  size="small"
                  value={slug}
                  onChange={event => setSlug(event.target.value)}
                  placeholder={`${t('blogWrite.form.slugPlaceholder')}`}
                />
              </div>

              <div>
                {t('blogWrite.form.dir')}
                <Input
                  size="small"
                  value={dirs}
                  onChange={event => setDirs(event.target.value)}
                  placeholder={`${t('blogWrite.form.dirPlaceholder')}`}
                />
              </div>

              <div>
                {t('blogWrite.form.tag')}
                <div className={styles.tags}>
                  <HashTags
                    predefineTags={predefineHashTags}
                    callback={tags => setHashTags(tags.map(t => t.id))}
                  />
                </div>
              </div>
            </div>
          </Modal>
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.title}>
          <Input
            placeholder={`${t('blogWrite.main.titlePlaceholder')}`}
            value={title}
            onChange={event => setTitle(event.target.value)}
            bordered={false}
          />
        </div>
        <MdEditor
          value={content}
          onText={setContent}
          className={styles.editor}
        />
      </div>
    </div>
  );
}

export default connect(loginMapStateToProps)(Write);

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
