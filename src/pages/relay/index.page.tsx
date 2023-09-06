import {
  Avatar,
  Button,
  Card,
  Carousel,
  Divider,
  List,
  Select,
  Space,
  Statistic,
  Tabs,
} from 'antd';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import PostItems from 'components/PostItems';
import { EventMap, Filter, UserMap, WellKnownEventKind } from 'core/nostr/type';
import { Relay } from 'core/relay/type';
import { CallRelayType } from 'core/worker/type';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { onSetUserMap, setEventWithSeenMsgList } from 'pages/helper';
import { EventWithSeen } from 'pages/type';
import { useEffect, useState } from 'react';
import {
  normalizeWsUrl,
  displayTwoDigitNumber,
  chunkArray,
} from 'utils/common';

import styles from './index.module.scss';
import { SettingOutlined } from '@ant-design/icons';
import { RelayPool } from 'core/relay/pool';
import { useRouter } from 'next/router';
import { deserializeMetadata, shortifyNPub } from 'core/nostr/content';
import { Nip19, Nip19DataType } from 'core/nip/19';
import Link from 'next/link';
import { Nip172 } from 'core/nip/172';
import { recommendRelays } from './recommend';
import { kindToReadable } from 'core/nostr/util';
import { MsgFeed } from 'components/MsgFeed';

export function RelayPage() {
  const router = useRouter();
  const relayPool = new RelayPool();
  const myPublicKey = useMyPublicKey();

  const { worker, newConn, wsConnectStatus } = useCallWorker();
  const connectedWsUrls = Array.from(wsConnectStatus)
    .filter(v => v[1])
    .map(v => normalizeWsUrl(v[0]));
  const disconnectedWsUrls = Array.from(wsConnectStatus)
    .filter(v => !v[1])
    .map(v => normalizeWsUrl(v[0]));

  const [selectRelay, setSelectRelay] = useState<string>();
  const [selectTab, setSelectTab] = useState<string>('detail');
  const [myMsgList, setMyMsgList] = useState<EventWithSeen[]>([]);
  const [profileMsgList, setProfileMsgList] = useState<EventWithSeen[]>([]);
  const [communityMsgList, setCommunityProfileMsgList] = useState<
    EventWithSeen[]
  >([]);
  const [globalMsgList, setGlobalMsgList] = useState<EventWithSeen[]>([]);
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [eventMap, setEventMap] = useState<EventMap>(new Map());
  const [relays, setRelays] = useState<Relay[]>([]);

  const globalMsgLength = 200;
  useEffect(() => {
    if (!selectRelay) return;
    if (!worker) return;
    if (myPublicKey == null || myPublicKey.length === 0) return;

    if (selectTab === 'my-data') {
      setMyMsgList([]);
      worker
        ?.subFilter({
          filter: {
            authors: [myPublicKey],
          },
          callRelay: { type: CallRelayType.batch, data: [selectRelay] },
        })
        .iterating({
          cb: (event, relayUrl) => {
            if (event.pubkey !== myPublicKey) return;
            if (event.kind === WellKnownEventKind.set_metadata) {
              onSetUserMap(event, setUserMap);
            }
            setEventWithSeenMsgList(event, relayUrl!, setMyMsgList);
          },
        });

      return;
    }

    setProfileMsgList([]);
    worker
      ?.subFilter({
        filter: {
          kinds: [WellKnownEventKind.set_metadata],
          limit: 40,
        },
        callRelay: { type: CallRelayType.batch, data: [selectRelay] },
      })
      .iterating({
        cb: (event, relayUrl) => {
          if (!deserializeMetadata(event.content).name) return;
          setEventWithSeenMsgList(event, relayUrl!, setProfileMsgList);
        },
      });

    setCommunityProfileMsgList([]);
    worker
      ?.subFilter({
        filter: {
          kinds: [WellKnownEventKind.community_metadata],
          limit: 20,
        },
        callRelay: { type: CallRelayType.batch, data: [selectRelay] },
      })
      .iterating({
        cb: (event, relayUrl) => {
          if (!Nip172.parseCommunityMetadata(event).image) return;
          setEventWithSeenMsgList(event, relayUrl!, setCommunityProfileMsgList);
        },
      });

    setGlobalMsgList([]);
    worker
      ?.subFilter({
        filter: {
          limit: globalMsgLength,
        },
        callRelay: { type: CallRelayType.batch, data: [selectRelay] },
      })
      .iterating({
        cb: (event, relayUrl) => {
          setEventWithSeenMsgList(event, relayUrl!, setGlobalMsgList);
        },
      });
  }, [selectRelay, worker, myPublicKey, selectTab]);

  const initRelays = async () => {
    const relays = await relayPool.getAllRelays(true);
    setRelays(relays);
  };

  useEffect(() => {
    initRelays();
  }, []);

  useEffect(() => {
    if (connectedWsUrls.length > 0 && selectRelay == null) {
      setSelectRelay(connectedWsUrls[0]);
    }
  }, [connectedWsUrls]);

  const relayInfo = () => {
    if (selectRelay && relays.length > 0) {
      const target = relays.filter(
        r => normalizeWsUrl(r.url) === normalizeWsUrl(selectRelay),
      )[0];
      return (
        <div>
          <img src={target.icon} alt="" />
          <div className={styles.description}>
            {target.about} <br />
            {target.paymentsUrl}
            {target.postingPolicy}
            {target.software}
          </div>
          <div className={styles.nips}>
            <Space>
              {target.supportedNips?.map(n => (
                <Link
                  key={n}
                  href={`https://github.com/nostr-protocol/nips/blob/master/${displayTwoDigitNumber(
                    n,
                  )}.md`}
                >
                  {displayTwoDigitNumber(n)}
                </Link>
              ))}
            </Space>
          </div>
          <div>
            <List itemLayout="horizontal" bordered>
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={target.operatorDetail?.picture} />}
                  title={
                    <a href="https://ant.design">
                      {target.operatorDetail?.name ||
                        (target.operator &&
                          shortifyNPub(
                            Nip19.encode(
                              target.operator,
                              Nip19DataType.Npubkey,
                            ),
                          )) ||
                        '...'}
                    </a>
                  }
                  description={target.operatorDetail?.about}
                />
              </List.Item>
            </List>
          </div>
        </div>
      );
    } else {
      return <>unknown info</>;
    }
  };

  const kindsResult = Object.entries(
    globalMsgList.reduce(
      (acc, { kind }) => ({ ...acc, [kind]: (acc[kind] || 0) + 1 }),
      {},
    ),
  ).map(([kind, count]) => ({ kind: Number(kind), count }));

  const myKindsResult = Object.entries(
    myMsgList.reduce(
      (acc, { kind }) => ({ ...acc, [kind]: (acc[kind] || 0) + 1 }),
      {},
    ),
  ).map(([kind, count]) => ({ kind: Number(kind), count }));

  return (
    <BaseLayout>
      <Left>
        <div>
          <div className={styles.status}>
            <div className={styles.relayStatus}>
              <div className={styles.relayBar}>
                <span className={styles.wifiBar}>
                  {connectedWsUrls.map(url => (
                    <span key={url} style={{ color: 'green' }}>
                      |
                    </span>
                  ))}
                  {disconnectedWsUrls.map(url => (
                    <span key={url} style={{ color: '#c6c0c0' }}>
                      |
                    </span>
                  ))}
                </span>
              </div>
              <Button
                type="link"
                icon={<SettingOutlined />}
                onClick={() => router.push('/relay-manager')}
              >
                Manage relays
              </Button>
            </div>
          </div>

          {/*
          <Divider></Divider>

          <div className={styles.recommend}>
            <h4>Recommend Relays</h4>
            <div className={styles.container}>
              <List
                grid={{
                  gutter: 16,
                  xs: 1,
                  sm: 1,
                  md: 1,
                  lg: 1,
                  xl: 1,
                  xxl: 1,
                }}
                dataSource={recommendRelays.slice(0, 6)}
                renderItem={r => {
                  return (
                    <List.Item>
                      <Card
                        hoverable
                        onClick={() => router.push('/relay/' + r.url)}
                      >
                        <div className={styles.name}>
                          <Avatar src={r.picture} />
                          <div>
                            <div>{r.url}</div>
                            <div className={styles.description}>
                              {r.description}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </List.Item>
                  );
                }}
              />
            </div>
          </div>
        */}

          <Divider></Divider>

          <div className={styles.selector}>
            <h4>Inspect a relay from current group</h4>
            <Select
              showSearch
              placeholder="select relay to show detail"
              onChange={val => setSelectRelay(val)}
              value={selectRelay}
              options={
                connectedWsUrls.map(url => {
                  return {
                    value: url,
                    label: url,
                  };
                }) || []
              }
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').includes(input)
              }
            />

            <Tabs
              defaultActiveKey="detail"
              onChange={val => setSelectTab(val)}
              items={[
                { label: 'Detail', key: 'detail' },
                { label: 'My data', key: 'my-data' },
              ]}
            />
          </div>

          {selectTab === 'detail' && (
            <>
              <div className={styles.info}>{relayInfo()}</div>

              <div className={styles.users}>
                <h4>Recent Users</h4>
                <Carousel>
                  {chunkArray(profileMsgList, 6).map((m, index) => (
                    <List
                      key={index}
                      grid={{
                        gutter: 16,
                        xs: 3,
                        sm: 3,
                        md: 6,
                        lg: 6,
                        xl: 6,
                        xxl: 6,
                      }}
                      dataSource={m}
                      renderItem={event => {
                        const profile = deserializeMetadata(event.content);
                        const name =
                          profile.name || profile.display_name || '...';
                        return (
                          <List.Item>
                            <Card
                              hoverable
                              onClick={() =>
                                router.push('/user/' + event.pubkey)
                              }
                            >
                              <div className={styles.profile}>
                                <div>
                                  <Avatar src={profile.picture} />
                                </div>
                                <div>{name}</div>
                              </div>
                            </Card>
                          </List.Item>
                        );
                      }}
                    />
                  ))}
                </Carousel>
              </div>

              <div className={styles.comm}>
                <h4>Hosted Communities</h4>
                <List
                  grid={{
                    gutter: 16,
                    xs: 3,
                    sm: 3,
                    md: 6,
                    lg: 6,
                    xl: 6,
                    xxl: 6,
                  }}
                  dataSource={communityMsgList.slice(0, 6)}
                  renderItem={event => {
                    const profile = Nip172.parseCommunityMetadata(event);
                    const name = profile.id || '...';
                    return (
                      <List.Item>
                        <Card
                          hoverable
                          onClick={() => router.push('/user/' + event.pubkey)}
                          cover={
                            <img
                              style={{ height: '80px' }}
                              src={profile.image}
                            />
                          }
                        >
                          <div>{name}</div>
                        </Card>
                      </List.Item>
                    );
                  }}
                />
              </div>

              <div className={styles.comm}>
                <h4>
                  Last {globalMsgList.filter(m => m !== null).length} events
                  include
                </h4>
                <div className={styles.statics}>
                  {kindsResult.map(item => {
                    if ((item.count as number) > 0) {
                      return (
                        <Statistic
                          key={item.kind}
                          title={kindToReadable(item.kind)}
                          value={item.count as number}
                        />
                      );
                    }
                  })}
                </div>
              </div>
              <Divider></Divider>
              {/*
          {selectRelay && <MsgFeed worker={worker} msgFilter={{kinds: [WellKnownEventKind.text_note]}} newConn={selectRelay ? [selectRelay] : []} userMap={userMap} setUserMap={setUserMap} eventMap={eventMap} setEventMap={setEventMap} emptyDataReactNode={<></>} maxMsgLength={10} />}
          */}
            </>
          )}

          {selectTab === 'my-data' && (
            <>
              <div className={styles.comm}>
                <h4>
                  Last {myMsgList.filter(m => m !== null).length} events
                </h4>
                <div className={styles.statics}>
                  {myKindsResult.map(item => {
                    if ((item.count as number) > 0) {
                      return (
                        <Statistic
                          key={item.kind}
                          title={kindToReadable(item.kind)}
                          value={item.count as number}
                        />
                      );
                    }
                  })}
                </div>
              </div>
              <Divider></Divider>
              <PostItems
                msgList={myMsgList.slice(0, 20)}
                worker={worker!}
                relays={worker?.relays.map(r => r.url) || []}
              />
            </>
          )}
        </div>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
}

export default RelayPage;

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
