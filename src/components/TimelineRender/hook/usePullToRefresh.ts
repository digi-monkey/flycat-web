import { useCallback, useState } from 'react';

export interface PullToRefreshProp {
  queryMsgFromDb: (enableCache?: boolean) => Promise<void>;
}

export function usePullToRefresh({ queryMsgFromDb }: PullToRefreshProp) {
  const [isPullRefreshing, setIsPullRefreshing] = useState<boolean>(false);
  const pullToRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      const readFromCache = false;
      await queryMsgFromDb(readFromCache);
    } catch (error) {}

    setIsPullRefreshing(false);
  }, [queryMsgFromDb]);

  return { pullToRefresh, isPullRefreshing, setIsPullRefreshing };
}
