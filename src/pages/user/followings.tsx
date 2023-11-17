import { EventSetMetadataContent, PublicKey } from 'core/nostr/type';
import {
  Alert,
  Avatar,
  Button,
  Dropdown,
  List,
  MenuProps,
  Modal,
  message,
} from 'antd';
import { Paths } from 'constants/path';
import { copyToClipboard } from 'utils/common';
import { useRouter } from 'next/router';
import { profileQuery } from 'core/db';
import { useEffect, useState } from 'react';
import { DbEvent } from 'core/db/schema';
import { CallWorker } from 'core/worker/caller';

import Icon from 'components/Icon';
import styles from './index.module.scss';
import Link from 'next/link';

export interface FollowingsProp {
  buildFollowUnfollow: (publicKey: string) => {
    label: string;
    action: () => any;
  };
  pks: PublicKey[];
  worker: CallWorker | undefined;
}

export const Followings: React.FC<FollowingsProp> = ({
  pks,
  worker,
  buildFollowUnfollow,
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [profiles, setProfiles] = useState<DbEvent[]>([]);
  
  useEffect(()=>{
    if(pks.length===0)return;

    profileQuery.table.bulkGet(pks).then(events => {
      setProfiles(events.filter(e=>e!=null)as DbEvent[]);
    })
  }, [pks]);

  useEffect(() => {
    if (!worker) return;
    const unknownPks = pks.filter(
      pk => !profiles.map(p => p.pubkey).includes(pk),
    );
    worker.subMetadata(unknownPks);
  }, [profiles.length, worker]);

  const getProfileMetadata = (pk: string) => {
    const pEvent = profiles.find(e => e.pubkey === pk);
    const profile: EventSetMetadataContent | undefined = pEvent?.content
      ? JSON.parse(pEvent?.content)
      : undefined;
    return profile;
  };

  const viewMore = () => {
    Modal.info({
      closable: true,
      width: '600px',
      bodyStyle: { height: 'auto' },
      title: 'Following List',
      content: (
        <List
          className={styles.modalList}
          itemLayout="horizontal"
          dataSource={pks}
          renderItem={pk => {
            const profile = getProfileMetadata(pk);
            return (
              <List.Item
                actions={[
                  <a
                    key="list-loadmore-edit"
                    onClick={buildFollowUnfollow(pk).action}
                  >
                    {buildFollowUnfollow(pk).label}
                  </a>,
                  <a key="list-loadmore-more" href={Paths.user + `/${pk}`}>
                    view
                  </a>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={profile?.picture} />}
                  title={<a href={Paths.user + `/${pk}`}>{profile?.name}</a>}
                  description={profile?.about}
                />
              </List.Item>
            );
          }}
        />
      ),
    });
  };
  
  return (
    <div className={styles.following}>
      {contextHolder}
      <div className={styles.followingTitle}>Followings</div>
      {pks.slice(0, 5).map(key => {
        const profile = getProfileMetadata(key);
        const items: MenuProps['items'] = [
          {
            label: buildFollowUnfollow(key).label,
            key: '0',
            onClick: () => buildFollowUnfollow(key).action(),
          },
          {
            label: 'copy user metadata',
            key: '1',
            onClick: () => {
              try {
                copyToClipboard(JSON.stringify(profile));
                message.success('note id copy to clipboard!');
              } catch (error: any) {
                message.error(`note id copy failed! ${error.message}`);
              }
            },
          },
        ];
        return (
          <li key={key} className={styles.followingList}>
            <Link
              className={styles.user}
              href={"/user/"+key}
            >
              <Avatar size={'small'} src={profile?.picture} alt="" />
              <div>{profile?.name || '...'}</div>
            </Link>
            <div>
              <Dropdown
                menu={{ items }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Icon type="icon-more-horizontal" className={styles.icon} />
              </Dropdown>
            </div>
          </li>
        );
      })}
      <div className={styles.viewBtnContainer}>
        <Button style={{ padding: 0 }} type="link" onClick={viewMore}>
          View all {pks.length}
        </Button>
      </div>
    </div>
  );
};
