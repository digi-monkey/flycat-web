import { useEffect } from "react";
import { LOCAL_SAVE_KEY } from "constants/common";
import { getLocalSave } from "pages/blog/write/utils";

export function useDrafts(setDrafts) {
  useEffect(() => {
    const draftIds = localStorage.getItem(LOCAL_SAVE_KEY);
    const drafts:object[] = [];

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