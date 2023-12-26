import { dbQuery } from 'core/db';
import { Nip188 } from 'core/nip/188';
import { Nip19, Nip19DataType } from 'core/nip/19';
import { Filter } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MsgFilter,
  MsgFilterKey,
  MsgFilterMode,
} from '../../../core/msg-filter/filter';
import { createCallRelay } from 'core/worker/util';

export function useQueryNoScript({
  worker,
  newConn,
}: {
  worker: CallWorker | undefined;
  newConn: string[];
}) {
  const [filterOptions, setFilterOptions] = useState<MsgFilter[]>([]);

  const queryNoscript = useCallback(async () => {
    if (!worker) return;

    const filter: Filter = Nip188.createQueryNoscriptFilter([]);

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
      const noscript: MsgFilter = {
        key: `${id}@${authorPubkey}`,
        label: `${id}@${authorPubkey}`,
        description,
        filter: Nip188.parseNoscriptMsgFilterTag(e),
        wasm: Nip188.parseNoscript(e),
        mode: MsgFilterMode.global,
      };
      return noscript;
    });
    console.log('noscripts: ', noscripts);
    if (noscripts.length === 0) {
      const callRelay = createCallRelay(newConn);
      worker.subFilter({ filter, callRelay });
    }
    setFilterOptions(noscripts);
  }, [worker, newConn]);

  useEffect(() => {
    queryNoscript();
  }, [worker, newConn]);

  const noscriptFiltersMaps = useMemo(
    () =>
      filterOptions.reduce(
        (map, filter) => ({
          ...map,
          [filter.key]: filter,
        }),
        {} as Record<MsgFilterKey, MsgFilter>,
      ),
    [filterOptions],
  );

  return noscriptFiltersMaps;
}
