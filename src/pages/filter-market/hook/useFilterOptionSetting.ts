import { Nip188 } from 'core/nip/188';
import { Event } from 'core/nostr/Event';
import { EventId } from 'core/nostr/type';
import { useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { NoscriptItem } from './useFilterNoscripts';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { MsgFilter, MsgFilterMode } from 'core/msg-filter/filter';

export interface FilterOption extends NoscriptItem {
  naddr: string;
  disabled: boolean;
}

export interface FilterOptionSetting {
  options: FilterOption[];
  appDataEventId?: EventId;
}

export function useFilterOptionSetting() {
  const myPublicKey = useSelector(
    (state: RootState) => state.loginReducer.publicKey,
  );
  const key = useMemo(() => `filterOptions:${myPublicKey}`, [myPublicKey]);
  const defaultSetting: FilterOptionSetting = { options: [] };
  const [filterOptionSetting, setFilterOptionSetting] =
    useLocalStorage<FilterOptionSetting>(key, defaultSetting);

  const addOpt = (event: Event) => {
    const option: FilterOption = {
      event,
      disabled: false,
      title: Nip188.parseNoscriptTitle(event),
      description: Nip188.parseNoscriptDescription(event),
      picture: Nip188.parseNoscriptPicture(event),
      naddr: Nip188.parseNoscriptNaddr(event),
      filter: Nip188.parseNoscriptMsgFilterTag(event),
    };

    setFilterOptionSetting(prev => {
      const s = prev;
      s.options.push(option);
      return s;
    });
  };

  const deleteOpt = (event: Event) => {
    const naddr = Nip188.parseNoscriptNaddr(event);
    setFilterOptionSetting(prev => {
      const s = prev;
      s.options = s.options.filter(opt => opt.naddr !== naddr);
      return s;
    });
  };

  const getOpts = () => {
    return filterOptionSetting.options;
  };

  const isAdded = (event: Event) => {
    const naddr = Nip188.parseNoscriptNaddr(event);
    return (
      filterOptionSetting.options.find(opt => opt.naddr === naddr) != undefined
    );
  };

  const toMsgFilter = (item: FilterOption) => {
    const res: MsgFilter = {
      key: item.naddr,
      label: `${item.title}@${item.event.pubkey.slice(0, 3)}`,
      description: item.description,
      filter: item.filter,
      mode: MsgFilterMode.custom,
      wasm: Nip188.parseNoscript(item.event),
      selfEvent: item.event,
    };
    return res;
  };

  return { addOpt, deleteOpt, getOpts, isAdded, toMsgFilter };
}
