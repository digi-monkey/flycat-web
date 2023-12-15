import { useEffect, useState } from 'react';
import { Event } from 'core/nostr/Event';
import { Avatar, Divider, Input, List, Spin } from 'antd';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { searchRelays, seedRelays } from 'core/relay/pool/seed';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useCallWorker } from 'hooks/useWorker';
import { ConnPool } from 'core/api/pool';
import { WS } from 'core/api/ws';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbQuery, profileQuery } from 'core/db';
import { Filter, PublicKey, WellKnownEventKind } from 'core/nostr/type';
import { DbEvent } from 'core/db/schema';
import { validateFilter } from 'components/MsgFeed/util';
import { deserializeMetadata } from 'core/nostr/content';
import { Paths } from 'constants/path';
import { useRouter } from 'next/router';
import { isValidNpub } from 'utils/validator';
import { parseNpub } from 'utils/common';

import Icon from 'components/Icon';
import styles from './index.module.scss';
import PageTitle from 'components/PageTitle';
import PostItems from 'components/PostItems';
import Link from 'next/link';
import { createCallRelay } from 'core/worker/util';

export function Search() {
  const router = useRouter();
  const urlKeyWord = router.query.keyword as string | undefined;

  const [keyword, setKeyWord] = useState<string>();
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [pubkeyEvent, setPubkeyEvent] = useState<DbEvent>();
  const [pubkey, setPubkey] = useState<PublicKey>();

  const { worker, newConn } = useCallWorker();

  useEffect(() => {
    if (urlKeyWord) {
      setKeyWord(urlKeyWord);
      subQueryToRelays(urlKeyWord);

      if (isValidNpub(urlKeyWord)) {
        try {
          const pubkey = parseNpub(urlKeyWord);
          setPubkey(pubkey);
          profileQuery.getProfileByPubkey(pubkey).then(event => {
            if (event) {
              setPubkeyEvent(event);
            }
          });
        } catch (error: any) {
          console.debug(
            'failed to parse npub from key word, ',
            urlKeyWord,
            'reason: ',
            error.message,
          );
        }
      }
    }
  }, [router]);

  useEffect(() => {
    if (pubkey && worker && !pubkeyEvent) {
      const callRelay = createCallRelay(newConn);
      worker.subMetadata([pubkey], undefined, callRelay).iterating({
        cb: event => {
          setPubkeyEvent({ ...event, ...{ seen: [], timestamp: 0 } });
        },
      });
    }
  }, [pubkey, worker, newConn]);

  const handleTabChange = key => {
    router.push(`?keyword=${key}`);
  };

  const queryFilter: Filter = {
    kinds: [WellKnownEventKind.text_note, WellKnownEventKind.long_form],
    limit: 50,
  };
  const isValidEvent = (e: Event) => {
    if (!keyword) return false;
    return e.content.toLowerCase().includes(keyword.toLowerCase());
  };
  const queryOnLocalDB = async () => {
    setIsQuerying(true);
    let result: DbEvent[] = [];
    if (!queryFilter || (queryFilter && !validateFilter(queryFilter))) {
      return result;
    }
    result = await dbQuery.matchFilterRelay(queryFilter, [], isValidEvent);
    setIsQuerying(false);
    return result;
  };

  const events = useLiveQuery(queryOnLocalDB, [keyword], [] as DbEvent[]);
  const profiles = useLiveQuery(
    profileQuery.createFilterByKeyword(keyword),
    [keyword],
    [] as DbEvent[],
  );

  const subQueryToRelays = async (keyword: string) => {
    console.log('to search: ', keyword);
    const filter = { search: `${keyword} sort:popular`, limit: 50 };
    const pool = new ConnPool();
    pool.addConnections(searchRelays);
    const fn = async (ws: WS) => {
      const dataStream = ws.subFilter(filter);
      const result: any[] = [];
      for await (const data of dataStream) {
        result.push(data);
      }
      return result;
    };
    await pool.executeConcurrently(fn);
  };

  const profileUI = (event: Event) => {
    const profile = deserializeMetadata(event.content);
    return (
      <List.Item
        actions={[
          <a key="list-loadmore-more" href={Paths.user + `/${event.pubkey}`}>
            view
          </a>,
        ]}
      >
        <List.Item.Meta
          avatar={<Avatar src={profile?.picture} />}
          title={
            <a href={Paths.user + `/${event.pubkey}`}>
              {profile?.display_name}@{profile?.name}
            </a>
          }
          description={profile?.about}
        />
      </List.Item>
    );
  };

  return (
    <BaseLayout>
      <Left>
        <PageTitle
          title={`Search ${keyword}`}
          icon={
            <Icon
              onClick={() => router.back()}
              width={24}
              height={24}
              type="icon-arrow-left"
            />
          }
        />
        <div className={styles.root}>
          <Input
            placeholder="Search"
            prefix={<Icon type="icon-search" />}
            onPressEnter={value => {
              const keyword = value.currentTarget.value;
              if (keyword) {
                setKeyWord(keyword);
                handleTabChange(keyword);
                subQueryToRelays(keyword);
              }
            }}
          />
          {isQuerying && <Spin />}
          <Divider orientation="left">Profiles</Divider>
          <List>
            {pubkey && !pubkeyEvent && (
              <div>
                pubkey related profile not found, try visit{' '}
                <Link href={'/user/' + pubkey}>profile page?</Link>
              </div>
            )}
            {pubkeyEvent &&
              !profiles.map(p => p.pubkey).includes(pubkey!) &&
              profileUI(pubkeyEvent)}
            {profiles.slice(0, 20).map(profileUI)}
          </List>
        </div>

        <Divider orientation="left">Notes</Divider>
        <PostItems msgList={events} worker={worker!} />
      </Left>
      <Right></Right>
    </BaseLayout>
  );
}

export default Search;

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
