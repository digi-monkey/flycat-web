import { Button } from 'antd';
import { CallWorker } from 'core/worker/caller';
import { Filter } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { useTranslation } from 'react-i18next';
import { Loader } from 'components/Loader';
import { useTimelineMsg } from './hook/useTimelineMsg';
import PullToRefresh from 'react-simple-pull-to-refresh';
import PostItems from 'components/PostItems';

export interface TimelineRenderProp {
  feedId: string;
  filter?: Filter;
  isValidEvent?: (event: Event) => boolean;
  placeholder?: React.ReactNode;
  worker: CallWorker | undefined;
}

export const TimelineRender: React.FC<TimelineRenderProp> = ({
  feedId,
  filter,
  isValidEvent,
  placeholder,
  worker,
}) => {
  const { t } = useTranslation();

  const {
    feed,
    isLoadMore,
    isPullRefreshing,
    pullToRefresh,
    latestNewMsg,
    showLatest,
    loadMore,
    isLoadingMainFeed,
    status,
    latestCursor,
  } = useTimelineMsg({ feedId, worker, filter, isValidEvent });

  return (
    <>
      <Loader isLoading={isLoadingMainFeed && !isPullRefreshing} />
      <PullToRefresh onRefresh={pullToRefresh}>
        <>
          {latestNewMsg.length > 0 && (
            <div className="w-full py-2 mt-4 border-0 border-solid border-b border-neutral-200 text-center">
              <Button
                onClick={showLatest}
                type="link"
                className="text-primary-06"
              >
                Show {latestNewMsg.length} new posts
              </Button>
            </div>
          )}

          {feed.length > 0 && (
            <div className="mt-5">
              <PostItems
                msgList={feed}
                worker={worker!}
                showLastReplyToEvent={true}
              />
              <Loader isLoading={isLoadMore} />
              {!isLoadMore && (
                <Button type="link" block onClick={loadMore}>
                  {t('home.loadMoreBtn')}
                </Button>
              )}
            </div>
          )}

          {feed.length === 0 && !isLoadingMainFeed && (
            <div className="mt-5 lg:mt-32">{placeholder}</div>
          )}
        </>
      </PullToRefresh>
    </>
  );
};
