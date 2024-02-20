import { BaseLayout, Left, Right } from 'components/BaseLayout';
import {
  EventMap,
  EventSetMetadataContent,
  Naddr,
  UserMap,
  WellKnownEventKind,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { useCallWorker } from 'hooks/useWorker';
import { useRouter } from 'next/router';
import { Community } from './community';
import { CommunityMetadata, Nip172 } from 'core/nip/172';
import { deserializeMetadata } from 'core/nostr/content';
import { ReactNode, useEffect, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { createCallRelay } from 'core/worker/util';
import styles from './index.module.scss';
import Icon from '../../../components/Icon';
import { Input, Tooltip } from 'antd';
import Avatar from 'components/shared/ui/Avatar';

type UserParams = {
  addr: Naddr;
};

export default function NaddrCommunity() {
  const router = useRouter();
  const query = router.query as UserParams;
  const naddr = decodeURIComponent(query.addr);

  const { worker, newConn } = useCallWorker();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [eventMap, setEventMap] = useState<EventMap>(new Map());
  const [community, setCommunity] = useState<CommunityMetadata>();

  const [postCount, setPostCount] = useState<number>(0);
  const [contributorCount, setContributorCount] = useState<number>(0);
  const [myPostCount, setMyPostCount] = useState<number>(0);
  const [myUnApprovalPostCount, setMyUnApprovalPostCount] = useState<number>(0);
  const [actionButton, setActionButtom] = useState<ReactNode>();

  const handleEvent = (event: Event, relayUrl?: string) => {
    switch (event.kind) {
      case WellKnownEventKind.set_metadata:
        {
          const metadata: EventSetMetadataContent = deserializeMetadata(
            event.content,
          );
          setUserMap(prev => {
            const newMap = new Map(prev);
            const oldData = newMap.get(event.pubkey) as { created_at: number };
            if (oldData && oldData.created_at > event.created_at) {
              // the new data is outdated
              return newMap;
            }

            newMap.set(event.pubkey, {
              ...metadata,
              ...{ created_at: event.created_at },
            });
            return newMap;
          });
        }
        break;

      case Nip172.metadata_kind:
        const metadata = Nip172.parseCommunityMetadata(event);
        const addr = Nip172.communityAddr({
          identifier: metadata.id,
          author: metadata.creator,
        });
        console.log(event, addr, naddr);
        if (addr === naddr) {
          console.log('data!');
          setCommunity(metadata);
        }
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    if (!worker) return;

    const result = Nip172.parseCommunityAddr(naddr);
    const callRelay = createCallRelay(newConn);
    const filter = Nip172.communityByPkAndIdFilter(
      result.identifier,
      result.author,
    );
    worker.subFilter({ filter, callRelay }).iterating({ cb: handleEvent });
  }, [worker, newConn, naddr]);

  const splitText = (text: string) => {
    const parts = text.split(/(\d+\.)/);
    const filteredParts = parts.filter(part => part.trim() !== '');
    return filteredParts;
  };

  let formattedText: JSX.Element[] | null = null;

  if (community?.rules) {
    const parts = splitText(community.rules);
    formattedText = [];
    for (let i = 0; i < parts.length; i += 2) {
      formattedText.push(
        <p key={i}>
          {parts[i]}
          {parts[i + 1]}
        </p>,
      );
    }
  }

  return (
    <BaseLayout>
      <Left>
        {community && (
          <Community
            worker={worker}
            setEventMap={setEventMap}
            setUserMap={setUserMap}
            userMap={userMap}
            eventMap={eventMap}
            community={community}
            setPostCount={setPostCount}
            setContributorCount={setContributorCount}
            setMyPostCount={setMyPostCount}
            setMyUnApprovalPostCount={setMyUnApprovalPostCount}
            setActionButton={setActionButtom}
          />
        )}
      </Left>
      <Right>
        <div className={styles.rightPanel}>
          <Input placeholder="Search" prefix={<Icon type="icon-search" />} />
          <div className={styles.communityDataWrapper}>
            <div className={styles.dataContainer}>
              <p className={styles.dataNum}>{postCount}</p>
              <p className={styles.dataTitle}>Posts</p>
            </div>
            <div className={styles.dataContainer}>
              <p className={styles.dataNum}>{contributorCount}</p>
              <p className={styles.dataTitle}>Contributors</p>
            </div>
          </div>
          <div className={styles.rightPanelHeader}>Moderators</div>
          <div className={styles.avatarContainer}>
            {community?.moderators.slice(0, 3).map(pk => (
              <Tooltip key={pk} title={userMap.get(pk)?.name} placement="top">
                <a href={'/user/' + pk}>
                  <Avatar src={userMap.get(pk)?.picture} />
                </a>
              </Tooltip>
            ))}
          </div>
          <div className={styles.rightPanelHeader}>Rules</div>
          <div>{formattedText}</div>
          <div className={styles.calendarRecord}>
            <div className={styles.recordHeader}>My Record</div>
            <div className={styles.recordTime}>
              <Icon className="w-4 h-4" type="icon-Data" />
              <p> Since Jul 20, 2023 (1 days)</p>
            </div>
            <div className={styles.recordDataWrapper}>
              <div className={styles.recordDataContainer}>
                <p className={styles.recordData}>{myPostCount}</p>
                <p className={styles.recordTitle}>Posts</p>
              </div>
              <div className={styles.recordDataContainer}>
                <p className={styles.recordData}>
                  {myUnApprovalPostCount + myPostCount}
                </p>
                <p className={styles.recordTitle}>Submissions</p>
              </div>
            </div>
          </div>
          <div className={styles.followButton}>{actionButton}</div>
        </div>
      </Right>
    </BaseLayout>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});

export const getStaticPaths = () => ({ paths: [], fallback: true });
