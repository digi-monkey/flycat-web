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
  Tabs,
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
import styles from './index.module.scss';
import { maxStrings } from 'utils/common';
import { RelaySelectorStore } from 'components/RelaySelector/store';
import { useCallWorker } from 'hooks/useWorker';
import { AUTO_RECOMMEND_LIST, NIP_65_RELAY_LIST } from 'constants/relay';
import { Nip65 } from 'core/nip/65';
import { CallRelayType } from 'core/worker/type';
import Link from 'next/link';
import {
  updateGroupClassState,
  useLoadRelayGroup,
} from '../hooks/useLoadRelayGroup';
import { useMatchMobile } from 'hooks/useMediaQuery';
import { createCallRelay } from 'core/worker/util';

interface RelayGroupProp {
  groups: RelayGroupClass | undefined;
  setGroups: Dispatch<SetStateAction<RelayGroupClass | undefined>>;
}

export const RelayGroup: React.FC<RelayGroupProp> = ({ groups, setGroups }) => {
  const { t } = useTranslation();
  const myPublicKey = useReadonlyMyPublicKey();
  const isMobile = useMatchMobile();
  const { worker, newConn } = useCallWorker();
  const [messageApi, contextHolder] = message.useMessage();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('default');
  const [inputWsUrl, setInputWsUrl] = useState<string>();

  const renderRightPanel = () => {
    if (selectedGroupId === null) {
      return;
    }
    if (groups == null) {
      return;
    }

    const selectedItems = groups.map.get(selectedGroupId) || [];
    return (
      <RelayGroupTable
        groups={groups}
        setGroups={setGroups}
        groupId={selectedGroupId}
        relays={selectedItems}
      />
    );
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

    const callRelay = createCallRelay(newConn);

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
    if(!groups)return;

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
      groups.setGroup(AUTO_RECOMMEND_LIST, pickRelays.map(r => {
          return { url: r, read: true, write: true };
      }));
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
              New Auto-Recommend-List created! Please refresh the page to select and use it.
            </strong>
          </div>
        </>
      ),
    });
  };

  const mobileMenuItems =
    groups?.getAllGroupIds().map(groupId => {
      return {
        key: groupId,
        label:
          maxStrings(groupId, 12) +
          ' (' +
          groups.getGroupById(groupId)?.length +
          ')',
      };
    }) || [];

  return (
    <>
      <Row>
        <div className={styles.menuBtnGroups}>
          <Button type="primary" onClick={createNewGroup}>
            + Create new group
          </Button>
          <Button onClick={syncNip65Group}>Get NIP-65 Relay List</Button>
          <Button onClick={autoRelays}>Find Auto Relay List For Me</Button>
        </div>
        {isMobile && (
          <div className={styles.mobileMenu}>
            <div className={styles.title}>{mobileMenuItems.length} Groups</div>
            <Tabs activeKey={selectedGroupId} defaultActiveKey={selectedGroupId} items={mobileMenuItems} onChange={setSelectedGroupId} />
          </div>
        )}

        <Col xs={0} sm={6}>
          {contextHolder}
          <Menu
            mode={isMobile ? 'horizontal' : 'inline'}
            selectedKeys={selectedGroupId ? [selectedGroupId.toString()] : []}
            className={styles.selectorMenu}
          >
            {groups &&
              groups.getAllGroupIds().map(groupId => (
                <Menu.Item
                  key={groupId}
                  icon={<Icon type='icon-Move-out' className={styles.icon} />}
                  onClick={() => setSelectedGroupId(groupId)}
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
        <Col xs={24} sm={18}>
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
