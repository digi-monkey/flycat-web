import { TimelineRender } from 'components/TimelineRender';
import { TimelineFilterOption } from 'core/timeline-filter';
import { CallWorker } from 'core/worker/caller';
import { useMemo } from 'react';
import {
  initSync,
  is_valid_event,
  pre_validate,
} from 'core/noscript/filter-binding';
import { createRuntime } from 'core/noscript/filter-binding/runtime';
import { Event } from 'core/nostr/Event';
import { Filter, PublicKey } from 'core/nostr/type';
import { useMyFollowings } from './hooks/useMyFollowings';
import { FilterOptMode } from 'core/nip/188';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { isValidPublicKey } from 'utils/validator';

export interface TimelineProp {
  msgFilter: TimelineFilterOption;
  worker: CallWorker | undefined;
  visitingUser?: PublicKey;
}

export const Timeline: React.FC<TimelineProp> = ({
  msgFilter,
  worker,
  visitingUser,
}) => {
  const myFollowings = useMyFollowings();
  const myPublicKey = useReadonlyMyPublicKey();

  const feedId = useMemo(() => {
    return msgFilter.key;
  }, [msgFilter]);

  const filter: Filter | undefined = useMemo(() => {
    if (!msgFilter.filter) return undefined;

    if (msgFilter.mode === FilterOptMode.follow) {
      if (myFollowings.length === 0) return undefined;
      return { ...msgFilter.filter, ...{ authors: myFollowings } };
    }
    if (msgFilter.mode === FilterOptMode.signInUser) {
      if (!isValidPublicKey(myPublicKey)) return undefined;
      return { ...msgFilter.filter, ...{ authors: [myPublicKey] } };
    }
    if (msgFilter.mode === FilterOptMode.visitingUser) {
      if (!isValidPublicKey(visitingUser)) return undefined;
      return { ...msgFilter.filter, ...{ authors: [visitingUser!] } };
    }
    if (msgFilter.mode === FilterOptMode.trustNetwork) {
      // todo
    }

    return msgFilter.filter;
  }, [msgFilter, myFollowings, myPublicKey, visitingUser]);

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
