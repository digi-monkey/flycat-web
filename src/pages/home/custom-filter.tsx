import { Segmented, Tooltip } from 'antd';
import { MsgSubProp } from 'components/MsgFeed';
import { dbQuery } from 'core/db';
import { Nip188 } from 'core/nip/188';
import { Nip19, Nip19DataType } from 'core/nip/19';
import { Filter } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { initSync, is_valid_event } from 'pages/noscript/filter-binding';
import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { isValidPublicKey } from 'utils/validator';

import Link from 'next/link';

export interface CustomFilterProp {
  worker: CallWorker | undefined;
  onMsgPropChange: (prop: MsgSubProp) => any;
}

export interface MsgFilterNoscript {
  label: string;
  filter: Filter;
  wasm?: ArrayBuffer;
  description?: string;
}

export const CustomFilter: React.FC<CustomFilterProp> = ({
  worker,
  onMsgPropChange,
}) => {
  const myPublicKey = useReadonlyMyPublicKey();
  const [selectFilter, setSelectFilter] = useState<string>();
  const [filterOptions, setFilterOptions] = useState<MsgFilterNoscript[]>([]);

  const whitelist = [
    "45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a",
  ];
  if(isValidPublicKey(myPublicKey)){
    whitelist.push(myPublicKey);
  }

  const queryNoscript = async () => {
    if (!worker) return [];
    
    const filter: Filter = Nip188.createQueryNoscriptFilter(whitelist);
    worker.subFilter({ filter });
    const relayUrls = worker.relays.map(r => r.url);
    const scriptEvents = await dbQuery.matchFilterRelay(
      filter,
      relayUrls,
      Nip188.isValidCustomMsgFilterNoscript(),
    );
    const noscripts = scriptEvents.map((e, idx) => {
      const authorPubkey = Nip19.encode(e.pubkey, Nip19DataType.Npubkey).slice(
        0,
        12,
      );
      const id = e.tags.find(t => t[0] === 'd')
        ? (e.tags.find(t => t[0] === 'd') as any)[1]
        : 'unknown-id';
      const description = e.tags.find(t => t[0] === 'description')
        ? (e.tags.find(t => t[0] === 'description') as any)[1]
        : 'no description';
      const script: MsgFilterNoscript = {
        label: `${id}@${authorPubkey}`,
        description,
        filter: Nip188.parseNoscriptMsgFilterTag(e),
        wasm: Nip188.parseNoscript(e),
      };
      return script;
    });
    console.log('noscripts: ', noscripts);
    setFilterOptions(noscripts);
    return noscripts;
  };

  useEffect(() => {
    queryNoscript();
  }, [worker]);

  useEffect(() => {
    if (!selectFilter) return;

    const f = filterOptions.find(opt => opt.label === selectFilter);
    if (!f) return console.log('opt not found');

    const msgSubProp: MsgSubProp = {
      msgFilter: f.filter,
    };

    if (f.wasm) {
      initSync(f.wasm);
      msgSubProp.isValidEvent = is_valid_event;
    }
    onMsgPropChange(msgSubProp);
  }, [selectFilter]);

  return (
    <div>
      <div style={{ color: 'gray', marginBottom: '10px' }}>
        This is a experiment feature which enable custom timeline experience via
        loading a custom nostr script(a short wasm filtering program) composed
        by users instead of flycat or any other platforms/clients. For security
        concern, it only fetch scripts from whitelist now. You can try{' '}
        <Link href={'/noscript'}>make your own nostr scripts</Link>
      </div>

      <Segmented
        value={selectFilter}
        onChange={val => setSelectFilter(val as any)}
        options={filterOptions.map(option => ({
          label: (
            <Tooltip title={option.description} key={option.label}>
              {option.label}
            </Tooltip>
          ),
          value: option.label,
        }))}
      />
    </div>
  );
};
