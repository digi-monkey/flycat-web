import { Paths } from 'constants/path';
import { LOCAL_SAVE_KEY } from 'constants/common';
import { Nip23, Nip23ArticleMetaTags, DirTags, Article } from 'service/nip/23';
import { Event, WellKnownEventKind, EventSetMetadataContent } from 'service/api';

export const publish = async (articleParams, dir, signEvent, worker, router, setPublishedToast, pathname) => {
  const dirTags: DirTags = ([Nip23ArticleMetaTags.dir] as any).concat(
    dir.split('/').filter(d => d.length > 0),
  );
  const rawEvent = Nip23.create({
    ...articleParams,
    dirTags
  });
  
  if (signEvent == null) {
    return alert('sign method is null');
  }
  if (worker == null) {
    return alert('worker  is null');
  }

  const event = await signEvent(rawEvent);
  worker?.pubEvent(event);
  setPublishedToast(true);
  localStorage.removeItem(LOCAL_SAVE_KEY);
  setTimeout(() => router.push({ pathname }), 1500);
}

export const handleEvent = (publicKey, setUserMap, setArticle) => {
  return function handleEvent(event: Event, relayUrl?: string) {
    if (event.pubkey !== publicKey) return;

    if (event.kind === WellKnownEventKind.set_metadata) {
      const metadata: EventSetMetadataContent = JSON.parse(event.content);
      setUserMap(prev => {
        const newMap = new Map(prev);
        const oldData = newMap.get(event.pubkey) as { created_at: number };
        if (oldData && oldData.created_at > event.created_at) {
          // the new data is outdated
          return newMap;
        }

        newMap.set(event.pubkey, {
          ...metadata,
          ...{ created_at: event.created_at },
        });
        return newMap;
      });
      return;
    }

    if (event.kind === WellKnownEventKind.long_form) {
      if (event.pubkey !== publicKey) return;

      const data = Nip23.toArticle(event);

      setArticle(article => article?.updated_at && article?.updated_at >= data?.updated_at ? article : data);
    }
  }
}

export const setLocalSave = (article) => localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(article));

export const getLocalSave = () => {
  const article = localStorage.getItem(LOCAL_SAVE_KEY);

  if (article?.length) return JSON.parse(article);

  return null;
}

export const getPublishedUrl = (publicKey, articleId, myPublicKey, slug) => publicKey && articleId ? `${Paths.post + myPublicKey}/${slug}` : `${Paths.blog}/${myPublicKey}`;