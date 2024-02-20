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
import { Article } from 'core/nip/23';
import { UserMap } from 'core/nostr/type';
import { MdEditor } from 'components/Editor';
import { getDraftId } from 'utils/common';
import { noticePubEventResult } from 'components/PubEventNotice';
import { useToast } from 'components/shared/ui/Toast/use-toast';

import RelaySelector from 'components/RelaySelector';
import Link from 'next/link';
import { Button } from 'components/shared/ui/Button';
import { Input } from 'components/shared/ui/Input';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from 'components/shared/ui/Dialog';

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
    <div className="w-full p-0 m-0">
      <div className="sticky top-0 left-0 h-16 z-10 px-4 flex items-center justify-between bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-600">
        <Link
          href={Paths.home}
          className="w-full md:w-fit h-auto items-center justify-center flex"
        >
          <img
            className="object-contain w-[80px] h-[80px]"
            src="/logo/web/Flycat-logo-vt-dark.svg"
            alt="LOGO"
          />
        </Link>
        <div className="flex fixed md:static justify-between align-middle gap-4 md:w-auto py-5 h-auto left-2 right-2 bottom-2">
          {!articleId && (
            <Button
              variant={'secondary'}
              className="bg-neutral-100"
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

          <Dialog open={openPublishModal} onOpenChange={setOpenPublishModal}>
            <DialogPortal>
              <DialogOverlay />
              <DialogContent className="">
                <DialogTitle>Publish Setting</DialogTitle>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    Select Relays
                    <RelaySelector />
                  </div>

                  <div className="flex flex-col gap-2">
                    {t('blogWrite.form.coverImage')}
                    <div className="w-full h-[228px] flex flex-shrink-0 justify-center items-center rounded bg-neutral-200">
                      {image.length > 0 ? (
                        <div className="w-full h-full object-contain">
                          <img
                            src={image}
                            alt="banner"
                            className="w-full h-full object-contain"
                          />
                          <button
                            onClick={() => setImage('')}
                            className="absolute top-[40%] left-[50%] max-w-full transform -translate-x-1/2 -translate-y-1/2 p-4 bg-white bg-opacity-70 border-none cursor-pointer text-red-500"
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <div>
                          <ImageUploader onImgUrls={url => setImage(url[0])} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {t('blogWrite.form.summary')}
                    <Input
                      value={summary}
                      onChange={event => setSummary(event.currentTarget.value)}
                      placeholder={`${t('blogWrite.form.summary')}`}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    {t('blogWrite.form.slug')}
                    <Input
                      value={slug}
                      onChange={event => setSlug(event.currentTarget.value)}
                      placeholder={`${t('blogWrite.form.slugPlaceholder')}`}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    {t('blogWrite.form.dir')}
                    <Input
                      value={dirs}
                      onChange={event => setDirs(event.currentTarget.value)}
                      placeholder={`${t('blogWrite.form.dirPlaceholder')}`}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    {t('blogWrite.form.tag')}
                    <div>
                      <HashTags
                        predefineTags={predefineHashTags}
                        callback={tags => setHashTags(tags.map(t => t.id))}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full flex justify-end gap-2">
                  <Button
                    variant={'secondary'}
                    onClick={() => setOpenPublishModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={onPublish}>Publish</Button>
                </div>
              </DialogContent>
            </DialogPortal>
          </Dialog>
        </div>
      </div>

      <div className="md:w-[670px] px-2 w-auto mx-auto my-5 md:my-10 h-[calc(100vh-160px)] md:h-[calc(100vh-110px)] rounded-lg bg-gray-100">
        <div className="flex-1 bg-gray-100 h-10 md:h-16">
          <Input
            placeholder={`${t('blogWrite.main.titlePlaceholder')}`}
            value={title}
            onChange={event => setTitle(event.currentTarget.value)}
            className="px-0 border-0 bg-transparent text-xl font-bold py-1 md:text-2xl md:py-2"
          />
        </div>
        <MdEditor
          value={content}
          onText={setContent}
          className="min-h-[700px] overflow-hidden md:w-full md:h-[var(--height)]"
        />
      </div>
    </div>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});

export default dynamic(
  () => Promise.resolve(connect(loginMapStateToProps)(Write)),
  {
    ssr: false,
  },
);
