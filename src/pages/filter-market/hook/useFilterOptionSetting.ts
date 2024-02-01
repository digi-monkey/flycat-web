import { Nip188 } from 'core/nip/188';
import { Event } from 'core/nostr/Event';
import { EventId } from 'core/nostr/type';
import { useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { TimelineFilterOption } from 'core/timeline-filter';
import { FilterOption } from './useFilterNoscripts';

export interface FilterOptionSetting {
  options: FilterOption[];
  appDataEventId?: EventId;
}

export function useFilterOptionSetting() {
  const myPublicKey = useSelector(
    (state: RootState) => state.loginReducer.publicKey,
  );
  const key = useMemo(() => `filterOptions:v2:${myPublicKey}`, [myPublicKey]);
  const defaultSetting: FilterOptionSetting = { options: [] };
  const [filterOptionSetting, setFilterOptionSetting] =
    useLocalStorage<FilterOptionSetting>(key, defaultSetting);

  const addOpt = (filterOpt: FilterOption) => {
    setFilterOptionSetting(prev => {
      const s = prev;
      s.options.push(filterOpt);
      return s;
    });
  };

  const deleteOpt = (filterOpt: FilterOption) => {
    setFilterOptionSetting(prev => {
      const s = prev;
      s.options = s.options.filter(opt => opt.naddr !== filterOpt.naddr);
      return s;
    });
  };

  const getOpts = () => {
    return filterOptionSetting.options;
  };

  const isAdded = (filterOpt: FilterOption) => {
    return (
      filterOptionSetting.options.find(opt => opt.naddr === filterOpt.naddr) !=
      undefined
    );
  };

  const toMsgFilter = (filterOpt: FilterOption, event: Event) => {
    const res: TimelineFilterOption = {
      key: filterOpt.naddr,
      label: `${filterOpt.title}@${filterOpt.pubkey.slice(0, 3)}`,
      description: filterOpt.description,
      filter: filterOpt.filter,
      mode: filterOpt.mode,
      wasm: Nip188.parseNoscriptCode(event),
      selfEvent: event,
    };
    return res;
  };

  return { addOpt, deleteOpt, getOpts, isAdded, toMsgFilter };
}
