import { useTranslation } from 'next-i18next';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import {
  Button,
  Col,
  Divider,
  Input,
  Menu,
  Modal,
  Row,
  Tooltip,
  message,
} from 'antd';
import { Relay } from 'core/relay/type';
import { Event } from 'core/nostr/Event';
import RelayGroupTable from './table';
import { newRelay } from 'core/relay/util';
import { RelayPool } from 'core/relay/pool';
import { RelayGroup as RelayGroupClass } from 'core/relay/group';
import { OneTimeWebSocketClient } from 'core/api/onetime';
import Icon from 'components/Icon';
import { FolderOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import styles from './index.module.scss';
import { maxStrings } from 'utils/common';
import { RelaySelectorStore } from 'components/RelaySelector/store';
import { useCallWorker } from 'hooks/useWorker';
import { NIP_65_RELAY_LIST } from 'constants/relay';
import { Nip65 } from 'core/nip/65';
import { CallRelayType } from 'core/worker/type';
import Link from 'next/link';
import { updateGroupClassState, useLoadRelayGroup } from '../hooks/useLoadRelayGroup';

interface RelayGroupProp {
  groups: RelayGroupClass | undefined;
  setGroups: Dispatch<SetStateAction<RelayGroupClass | undefined>>;
}

export const RelayGroup: React.FC<RelayGroupProp> = ({
  groups,
  setGroups
}) => {
  const { t } = useTranslation();
  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn } = useCallWorker();
  const [messageApi, contextHolder] = message.useMessage();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('default');
  const [inputWsUrl, setInputWsUrl] = useState<string>();

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
    return <RelayGroupTable groups={groups} setGroups={setGroups} groupId={selectedGroupId} relays={selectedItems} />;
  };

  const addRelay = () => {
    if (inputWsUrl && selectedGroupId) {
      // todo: validate wss url
      groups?.addNewRelayToGroup(selectedGroupId, newRelay(inputWsUrl));
      updateGroupClassState(groups!, setGroups);
      setInputWsUrl('');
    }
  };

  const syncNip65Group = async () => {
    if (!worker) return;
    if (!groups) return;

    messageApi.info('try syncing Nip-65 Relay list from network..');

    const callRelay =
      newConn.length > 0
        ? {
            type: CallRelayType.batch,
            data: newConn,
          }
        : {
            type: CallRelayType.connected,
            data: [],
          };

    let event: Event | null = null;
    const dataStream = worker
      .subNip65RelayList({ pks: [myPublicKey], callRelay })
      .getIterator();
    for await (const data of dataStream) {
      if (!event) {
        event = data.event;
        continue;
      }

      if (event && event.created_at < data.event.created_at) {
        event = data.event;
      }
    }
    dataStream.unsubscribe();

    if (event) {
      groups.setGroup(NIP_65_RELAY_LIST, Nip65.toRelays(event));
      messageApi.success(
        'Find Nip-65 Relay list! Check your relay group named ' +
          NIP_65_RELAY_LIST,
      );
      return;
    }

    messageApi.error(
      'Can not find your Nip-65 Relay list across the network, please select different relays and try again',
    );
  };

  const createNewGroup = () => {
    const groupId = window.prompt('enter new group name: ');
    if (!groupId) return;

    const relays: Relay[] = [];
    groups?.setGroup(groupId, relays);
    updateGroupClassState(groups!, setGroups);
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
    if (pickRelays.length > 0) {
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
      content: (
        <>
          {pickRelays.map(r => (
            <p key={r}>{r}</p>
          ))}
          <Divider></Divider>
          <div>
            <strong>
              Switch to Auto mode if you want to use the these relays
            </strong>
          </div>
        </>
      ),
    });
  };

  return (
    <>
      <Row>
        <Col span={6}>
          {contextHolder}
          <Menu
            mode="inline"
            selectedKeys={selectedGroupId ? [selectedGroupId.toString()] : []}
            className={styles.selectorMenu}
          >
            <Menu.Item
              icon={<Icon type="icon-repost" className={styles.icon} />}
              key={'re-gen-auto-relay'}
              onClick={autoRelays}
              className={styles.btnMenu}
            >
              Auto Relays{' '}
              <Tooltip title="Automatically find relays for you based on our algorithm">
                <QuestionCircleOutlined />
              </Tooltip>
            </Menu.Item>

            <Menu.Item
              key={'create-nip65-group-btn'}
              icon={<Icon type="icon-repost" className={styles.icon} />}
              className={styles.btnMenu}
              onClick={syncNip65Group}
            >
              Nip65 Relay List{' '}
              <Tooltip
                title={
                  <>
                    <div>Sync your relay list from network</div>{' '}
                    <Link
                      href="https://github.com/nostr-protocol/nips/blob/master/65.md"
                      target="_blank"
                    >
                      What is Nip-65
                    </Link>
                  </>
                }
              >
                <QuestionCircleOutlined />
              </Tooltip>
            </Menu.Item>

            <Menu.Item
              key={'create-new-group-btn'}
              icon={<Icon type="icon-plus" className={styles.icon} />}
              className={styles.btnMenu}
              onClick={createNewGroup}
            >
              Create new group
            </Menu.Item>

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
                : 'unselected'}
            </div>
            <div className={styles.searchBar}>
              <Input
                placeholder="wss://"
                value={inputWsUrl}
                onChange={v => setInputWsUrl(v.currentTarget.value)}
                className={styles.input}
                suffix={
                  <Button type="link" onClick={addRelay}>
                    Add
                  </Button>
                }
              />
            </div>
          </div>

          <div className={styles.table}>{renderRightPanel()}</div>
        </Col>
      </Row>
    </>
  );
};
