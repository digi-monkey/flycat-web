import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { Button, Col, Input, Menu, Modal, Row, Space, message } from 'antd';
import { useRelayGroup } from '../hooks/useRelayGroup';
import { useDefaultGroup } from '../hooks/useDefaultGroup';
import { Relay } from 'core/relay/type';
import RelayGroupTable from './table';
import { newRelay } from 'core/relay/util';
import { RelayPool } from 'core/relay/pool';
import { OneTimeWebSocketClient } from 'core/websocket/onetime';
import Icon from 'components/Icon';
import { FolderOutlined } from '@ant-design/icons';
import styles from './index.module.scss';
import { maxStrings } from 'utils/common';
import { RelaySelectorStore } from 'components/RelaySelector/store';

export const RelayGroup: React.FC = () => {
  const { t } = useTranslation();
  const myPublicKey = useReadonlyMyPublicKey();
  const defaultGroups = useDefaultGroup();
  const groups = useRelayGroup(myPublicKey, defaultGroups);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [inputWsUrl, setInputWsUrl] = useState<string>();

  const [messageApi, contextHolder] = message.useMessage();

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  const renderRightPanel = () => {
    if (selectedGroupId === null) {
      return;
    }
    if (groups == null) {
      return;
    }

    const selectedItems = groups.map.get(selectedGroupId) || [];
    return <RelayGroupTable groupId={selectedGroupId} relays={selectedItems} />;
  };

  const addRelay = () => {
    if (inputWsUrl && selectedGroupId) {
      // todo: validate wss url
      groups?.addNewRelayToGroup(selectedGroupId, newRelay(inputWsUrl));
    }
  };

  const createNewGroup = () => {
    const groupId = window.prompt('enter new group name: ');
    if (!groupId) return;

    const relays: Relay[] = [];
    groups?.setGroup(groupId, relays);
  };
  const autoRelays = async () => {
    const messageKey = 'autoRelay';
    const progressCb = (restCount: number) => {
      messageApi.open({
        key: messageKey,
        type: 'loading',
        content: `${restCount} relays left to check..`,
        duration: 0,
      });
    };
    const progressStart = () => {
      messageApi.open({
        key: messageKey,
        type: 'info',
        content: 'start picking auto relays..',
        duration: 7,
      });
    };
    const progressEnd = () => {
      messageApi.open({
        key: messageKey,
        type: 'success',
        content: 'Loaded!',
        duration: 1,
      });
    };
    progressStart();
    const relayPool = new RelayPool();
    const relays = relayPool.seeds;
    const contactList =
      (await OneTimeWebSocketClient.fetchContactList({
        pubkey: myPublicKey,
        relays,
      })) || [];
    const pickRelays = await relayPool.getAutoRelay(
      relays,
      contactList,
      myPublicKey,
      progressCb,
    );
    progressEnd();
    if(pickRelays.length>0){
      const store = new RelaySelectorStore();
      store.saveAutoRelayResult(
        myPublicKey,
        pickRelays.map(r => {
          return { url: r, read: true, write: true };
        }),
      );
    }
    Modal.success({
      title: 'pick relays',
      content: pickRelays.map(r => <p key={r}>{r}</p>),
    });
  };

  return (
    <>
      <Row>
        <Col span={6}>
          <Menu
            mode="inline"
            selectedKeys={selectedGroupId ? [selectedGroupId.toString()] : []}
            className={styles.selectorMenu}
          >
            <Menu.Item
              key={'create-new-group-btn'}
              icon={<Icon type="icon-plus" className={styles.icon} />}
              className={styles.btnMenu}
              onClick={createNewGroup}
            >
              Create new group
            </Menu.Item>
            <Menu.Item
              icon={<Icon type="icon-repost" className={styles.icon} />}
              key={'re-gen-auto-relay'}
              onClick={autoRelays}
              className={styles.btnMenu}
            >
              Auto Relays
            </Menu.Item>
            {contextHolder}

            {groups &&
              groups.getAllGroupIds().map(groupId => (
                <Menu.Item
                  key={groupId}
                  icon={<FolderOutlined className={styles.icon} />}
                  onClick={() => handleGroupSelect(groupId)}
                >
                  <div className={styles.menuText}>
                    <span className={styles.name}>
                      {maxStrings(groupId, 12)}
                    </span>
                    <span className={styles.num}>
                      {groups.getGroupById(groupId)?.length}
                    </span>
                  </div>
                </Menu.Item>
              ))}
          </Menu>
        </Col>
        <Col span={18}>
          <div className={styles.rightHeader}>
            <div className={styles.selectedName}>
              {selectedGroupId
                ? selectedGroupId +
                  '(' +
                  groups?.map.get(selectedGroupId!)?.length +
                  ')'
                : "unselected"}
            </div>
            <div className={styles.searchBar}>
              <Input
                value={inputWsUrl}
                onChange={v => setInputWsUrl(v.currentTarget.value)}
                className={styles.input}
              />
              <Button onClick={addRelay} type="primary">
                Add
              </Button>
            </div>
          </div>

          <div>{renderRightPanel()}</div>
        </Col>
      </Row>
    </>
  );
};
