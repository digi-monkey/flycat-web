import { LOCAL_SAVE_KEY } from 'constants/common';
import { Article } from 'core/nip/23';
import { getLocalSave } from 'pages/write/util';
import { useEffect } from 'react';

export function useDrafts(setDrafts) {
  useEffect(() => {
    const draftIds = localStorage.getItem(LOCAL_SAVE_KEY);
    const drafts: Article[] = [];

    if (draftIds?.length) {
      (JSON.parse(draftIds) as string[]).forEach(id => {
        const article = getLocalSave(id);
        if (!article) return;

        drafts.push(article);
      });
    }

    setDrafts(drafts);
  }, []);
}
