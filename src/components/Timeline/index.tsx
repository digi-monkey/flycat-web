import { TimelineRender } from 'components/TimelineRender';
import { MsgFilter, MsgFilterMode } from 'core/msg-filter/filter';
import { CallWorker } from 'core/worker/caller';
import { useMemo } from 'react';
import {
  initSync,
  is_valid_event,
  pre_validate,
} from 'pages/noscript/filter-binding';
import { createRuntime } from 'pages/noscript/filter-binding/runtime';
import { Event } from 'core/nostr/Event';
import { Filter } from 'core/nostr/type';
import { useMyFollowings } from './hooks/useMyFollowings';

export interface TimelineProp {
  msgFilter: MsgFilter;
  worker: CallWorker | undefined;
}

export const Timeline: React.FC<TimelineProp> = ({ msgFilter, worker }) => {
  const myFollowings = useMyFollowings();

  const feedId = useMemo(() => {
    return msgFilter.key;
  }, [msgFilter]);

  const filter: Filter | undefined = useMemo(() => {
    if (!msgFilter.filter) return undefined;

    if (msgFilter.mode === MsgFilterMode.follow) {
      if (myFollowings.length === 0) return undefined;
      return { ...msgFilter.filter, ...{ authors: myFollowings } };
    }
    return msgFilter.filter;
  }, [msgFilter, myFollowings]);

  const isValidEvent = useMemo(() => {
    let isValidEvent: ((event: Event) => boolean) | undefined =
      msgFilter.isValidEvent;
    if (msgFilter.wasm) {
      initSync(msgFilter.wasm);
      if (msgFilter.selfEvent) {
        createRuntime(msgFilter.selfEvent);
      }
      isValidEvent = is_valid_event;
      if (typeof pre_validate === 'function') {
        try {
          pre_validate();
          console.log('exec pre_validate');
        } catch (error: any) {
          console.log(error.message);
        }
      }
    }
    return isValidEvent;
  }, [msgFilter, initSync, createRuntime, pre_validate]);

  return (
    <TimelineRender
      feedId={feedId}
      filter={filter}
      isValidEvent={isValidEvent}
      worker={worker}
    />
  );
};
