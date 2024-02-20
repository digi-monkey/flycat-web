import { LOCAL_SAVE_KEY } from 'constants/common';
import { Nip23, DirTags, Nip23ArticleMetaTags } from 'core/nip/23';
import { Event } from 'core/nostr/Event';
import { WellKnownEventKind, EventSetMetadataContent } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';

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

      setArticle(article =>
        article?.updated_at && article?.updated_at >= data?.updated_at
          ? article
          : data,
      );
    }
  };
};

export const setLocalSave = article => {
  const { did } = article;
  if (localStorage.getItem(did)) {
    localStorage.setItem(did, JSON.stringify(article));
  } else {
    let newArticle = [did];
    const localArticle = localStorage.getItem(LOCAL_SAVE_KEY);

    if (localArticle) newArticle = newArticle.concat(JSON.parse(localArticle));

    localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(newArticle));
    localStorage.setItem(did, JSON.stringify(article));
  }
};

export const getLocalSave = did => {
  const article = localStorage.getItem(did);

  if (article?.length) return JSON.parse(article);

  return null;
};

export const delLocalSave = did => {
  localStorage.removeItem(did);
  const target = localStorage.getItem(LOCAL_SAVE_KEY);

  if (target?.length) {
    const ids = JSON.parse(target) as string[];

    if (ids.length > 1) {
      localStorage.setItem(
        LOCAL_SAVE_KEY,
        JSON.stringify(ids.filter(articleId => articleId !== did)),
      );
    } else {
      localStorage.removeItem(LOCAL_SAVE_KEY);
    }
  }
};

export const publish = async (
  articleParams,
  dir,
  signEvent,
  worker: CallWorker,
) => {
  const dirTags: DirTags = ([Nip23ArticleMetaTags.dir] as any).concat(
    dir.split('/').filter(d => d.length > 0),
  );
  const rawEvent = Nip23.create({
    ...articleParams,
    dirTags,
  });

  if (signEvent == null) {
    return alert('sign method is null');
  }

  if (worker == null) {
    return alert('worker  is null');
  }

  try {
    const event = await signEvent(rawEvent);
    const handler = worker.pubEvent(event);
    delLocalSave(articleParams.did);
    return handler;
  } catch (error: any) {
    alert('publish failed, ' + error.message);
  }
};
