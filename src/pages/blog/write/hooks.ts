import { Nip23 } from 'service/nip/23';
import { useRouter } from 'next/router';
import { useEffect } from "react";
import { useCallWorker } from "hooks/useWorker";
import { CallRelayType } from 'service/worker/type';
import { getLocalSave, handleEvent } from './utils';

type Query = {
  publicKey: string;
  articleId: string;
}

export function useWorker(setUserMap, setArticle, setIsRestore) {
  const { worker, newConn } = useCallWorker();
  const { publicKey, articleId } = useRouter().query as Query;
  
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
      ?.subFilter(filter, undefined, undefined, {
        type: CallRelayType.batch,
        data: newConn,
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
  setDir,
  setHashTags,
  setPredefineHashTags
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
  
    if (dirs) setDir(dirs.join('/'));
    if (hashTags) {
      setHashTags(hashTags);
      setPredefineHashTags( hashTags.map(t => ({ id: t, text: t })) );
    }
  }, [
    article, 
    setTitle,
    setSummary,
    setContent,
    setImage,
    setSlug,
    setDir,
    setHashTags,
    setPredefineHashTags
  ]);
}

export function useRestoreArticle(setDraft, setToast, isRestore) {
  const { title } = useRouter().query;
  useEffect(() => {
    const _article = getLocalSave(title);
    if (_article && isRestore) {
      setDraft(_article);
      setToast(true);
    }
  }, [isRestore, title]);
}