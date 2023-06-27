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
import { db } from 'core/relay/auto';

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
      return <div>Please select a group</div>;
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
    const groupId = window.prompt('new group id: ');
    if (!groupId) return;

    const relays: Relay[] = [];
    const relayUrl = window.prompt('relay: ');
    if (relayUrl) {
      relays.push({ url: relayUrl, read: true, write: true });
    }
    groups?.setGroup(groupId, relays);
  };

  const pickRelay = async()=>{
    const messageKey = "pickAutoRelay";
    const progressCb = () => {
      messageApi.open({
        key: messageKey,
        type: 'loading',
        content: `relays left to check..`,
        duration: 0,
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
    progressCb();

    const relayPool = new RelayPool();
    const relays =  relayPool.seeds;
    const contactList = await OneTimeWebSocketClient.fetchContactList({pubkey: myPublicKey, relays}) || [];
    const pickRelays = await relayPool.pickRelay(relays, contactList);

    progressEnd();
    Modal.success({
      title: "pickRelays",
      content: pickRelays.map(r => <p key={r}>{r}</p> )
    });
  }

  const getBestRelay = async()=>{
    const relayPool = new RelayPool();
    const relays = await relayPool.getAllRelays();
    const messageKey = "getBestRelay";
    const progressCb = (restCount: number) => {
      messageApi.open({
        key: messageKey,
        type: 'loading',
        content: `${restCount} relays left to check..`,
        duration: 0,
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
    await relayPool.getBestRelay(relays.map(r=>r.url), myPublicKey, progressCb) || [];
    const bestRelay = (await db.pick(myPublicKey)).slice(0, 6).map(i => i.relay);
    progressEnd();
    Modal.success({
      title: "bestRelay",
      content: bestRelay.map(r => <p key={r}>{r}</p> )
    });
  }

  const autoRelays = async()=>{
    const messageKey = "autoRelay";
    const progressCb = (restCount: number) => {
      messageApi.open({
        key: messageKey,
        type: 'loading',
        content: `${restCount} relays left to check..`,
        duration: 0,
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
    const relayPool = new RelayPool();
    const relays =  relayPool.seeds;
    const contactList = await OneTimeWebSocketClient.fetchContactList({pubkey: myPublicKey, relays}) || [];
    const pickRelays = await relayPool.getAutoRelay(relays, contactList, myPublicKey, progressCb);
    progressEnd();
    Modal.success({
      title: "pickRelays",
      content: pickRelays.map(r => <p key={r}>{r}</p> )
    });
  }

  return (
    <>
      <Row>
        <Col span={6}>
          <Button onClick={autoRelays}>auto relays</Button>
        <Button onClick={pickRelay}>pickRelay</Button>
        <Button onClick={getBestRelay}>getBestRelay</Button>
        {contextHolder}
          <Button onClick={createNewGroup}>new group</Button>
          <Menu
            mode="inline"
            selectedKeys={selectedGroupId ? [selectedGroupId.toString()] : []}
          >
            {groups &&
              groups.getAllGroupIds().map(groupId => (
                <Menu.Item
                  key={groupId}
                  onClick={() => handleGroupSelect(groupId)}
                >
                  {groupId}({groups.getGroupById(groupId)?.length})
                </Menu.Item>
              ))}
          </Menu>
        </Col>
        <Col span={18}>
          <Row>
            <Col span={12}>
              {selectedGroupId}
              {'(' + groups?.map.get(selectedGroupId!)?.length + ')'}
            </Col>
            <Col span={12}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={inputWsUrl}
                  onChange={v => setInputWsUrl(v.currentTarget.value)}
                />
                <Button onClick={addRelay} type="primary">
                  Add
                </Button>
              </Space.Compact>
            </Col>
          </Row>
          <div>{renderRightPanel()}</div>
        </Col>
      </Row>
    </>
  );
};
