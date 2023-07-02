import { PublicKey, UserMap } from 'core/nostr/type';
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

import Icon from 'components/Icon';
import styles from './index.module.scss';
import { copyToClipboard } from 'utils/common';

export interface FollowingsProp {
  buildFollowUnfollow: (publicKey: string) => {
    label: string;
    action: () => any;
  };
  pks: PublicKey[];
  userMap: UserMap;
}

export const Followings: React.FC<FollowingsProp> = ({
  pks,
  userMap,
  buildFollowUnfollow,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const viewMore = () => {
    Modal.info({
      closable: true,
      width: '600px',
      bodyStyle: { height: 'auto', maxHeight: '500px', overflow: 'scroll' },
      title: 'Following List',
      content: (
        <List
          className="demo-loadmore-list"
          itemLayout="horizontal"
          dataSource={pks}
          renderItem={pk => (
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
                avatar={<Avatar src={userMap.get(pk)?.picture} />}
                title={
                  <a href={Paths.user + `/${pk}`}>{userMap.get(pk)?.name}</a>
                }
                description={userMap.get(pk)?.about}
              />
            </List.Item>
          )}
        />
      ),
    });
  };
  return (
    <div className={styles.following}>
      {contextHolder}
      <div className={styles.followingTitle}>Followings</div>
      {pks.slice(0, 5).map(key => {
        const items: MenuProps['items'] = [
          {
            label: buildFollowUnfollow(key).label,
            key: '0',
            onClick: () => buildFollowUnfollow(key).action,
          },
          {
            label: 'copy user metadata',
            key: '1',
            onClick: () => {
              try {
                copyToClipboard(JSON.stringify(userMap.get(key)));
                message.success('note id copy to clipboard!');
              } catch (error: any) {
                message.error(`note id copy failed! ${error.message}`);
              }
            },
          },
        ];
        return (
          <li key={key} className={styles.followingList}>
            <div
              className={styles.user}
              onClick={() => window.open(Paths.user + `/${key}`, 'blank')}
            >
              <Avatar size={'small'} src={userMap.get(key)?.picture} alt="" />
              <div>{userMap.get(key)?.name || "..."}</div>
            </div>
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
