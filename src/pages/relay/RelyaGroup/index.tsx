import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { Button, Col, Input, Menu, Row, Space } from 'antd';
import { useRelayGroup } from '../hooks/useRelayGroup';
import { useDefaultGroup } from '../hooks/useDefaultGroup';
import { Relay } from 'core/relay/type';
import RelayGroupTable from './table';
import { newRelay } from 'core/relay/util';

export const RelayGroup: React.FC = () => {
  const { t } = useTranslation();
  const myPublicKey = useReadonlyMyPublicKey();
  const defaultGroups = useDefaultGroup();
  const groups = useRelayGroup(myPublicKey, defaultGroups);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [inputWsUrl, setInputWsUrl] = useState<string>();

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

  return (
    <>
      <Row>
        <Col span={6}>
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
