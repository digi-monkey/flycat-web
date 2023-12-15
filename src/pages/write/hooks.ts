import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useCallWorker } from 'hooks/useWorker';
import { getLocalSave, handleEvent } from './util';
import { Nip23 } from 'core/nip/23';
import { CallRelayType } from 'core/worker/type';

type Query = {
  publicKey: string;
  articleId: string;
};

export function useWorker(setUserMap, setArticle, setIsRestore) {
  const { worker, newConn } = useCallWorker();
  const query = useRouter().query as Query;
  const { publicKey } = query;
  const articleId = decodeURIComponent(query.articleId);

  useEffect(() => {
    if (newConn.length === 0 || !publicKey || !articleId) {
      setIsRestore(true);
      return;
    }

    const filter = Nip23.filter({
      authors: [publicKey],
      articleIds: [articleId],
    });
    worker
      ?.subFilter({
        filter,
        callRelay: {
          type: CallRelayType.batch,
          data: newConn,
        },
      })
      ?.iterating({ cb: handleEvent(publicKey, setUserMap, setArticle) });
  }, [newConn]);
}

export function useArticle(
  article,
  setTitle,
  setSummary,
  setContent,
  setImage,
  setSlug,
  setDirs,
  setHashTags,
  setPredefineHashTags,
) {
  useEffect(() => {
    if (!article) return;

    const {
      id,
      slug,
      dirs,
      content,
      hashTags,
      title = '',
      image = '',
      summary = '',
    } = article;

    setSlug(id || slug);
    setTitle(title);
    setImage(image);
    setSummary(summary);
    setContent(content);

    if (dirs) {
      setDirs((typeof dirs === 'string' ? [dirs] : dirs).join('/'));
    }
    if (hashTags) {
      setHashTags(hashTags);
      setPredefineHashTags(hashTags.map(t => ({ id: t, text: t })));
    }
  }, [
    article,
    setTitle,
    setSummary,
    setContent,
    setImage,
    setSlug,
    setDirs,
    setHashTags,
    setPredefineHashTags,
  ]);
}

export function useRestoreArticle(setArticle, setToast, isRestore) {
  const { did } = useRouter().query;

  useEffect(() => {
    const _article = getLocalSave(did);
    if (_article && isRestore) {
      setArticle(_article);
      setToast(true);
    }
  }, [isRestore, did]);
}
