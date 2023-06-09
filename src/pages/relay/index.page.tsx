import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Button, Col, Input, Menu, Row } from 'antd';
import { BaseLayout, Left } from 'components/layout/BaseLayout';
import { useRelayGroup } from './hooks/useRelayGroup';
import { useDefaultGroup } from './hooks/useDefaultGroup';
import { Relay } from 'service/relay/type';
import { RelayPool } from './pool';
import RelayGroupTable from './RelayGroupTable';
import Icon from '@ant-design/icons';

export function RelayManager() {
  const { t } = useTranslation();
  const myPublicKey = useReadonlyMyPublicKey();
  const defaultGroups = useDefaultGroup();
  const groups = useRelayGroup(myPublicKey, defaultGroups);

  const [isBrowserRelayPool, setIsBrowserRelayPool] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

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
    return (
      <ul>
        <RelayGroupTable  relays={selectedItems}/> 
      </ul>
    );
  };

  const addToGroup = (groupId: string, relay: Relay) => {
    groups?.addNewRelayToGroup(groupId, relay);
  }

  const createNewGroup = () => {
    const groupId = window.prompt("new group id: ");
    if(!groupId)return;

    const relays: Relay[] = []
    const relayUrl = window.prompt("relay: ");
    if(relayUrl){
      relays.push({url: relayUrl, read: true, write: true});
    }
    groups?.setGroup(groupId, relays);
  }

  return (
    <BaseLayout>
      <Left>
        { !isBrowserRelayPool && 
        <>
       <div style={{margin: "10px"}}>
       <span>Relays</span>
        <span style={{float: "right"}}> <a href="http://" target="_blank" rel="noopener noreferrer">Explore 500+ relays</a> </span>
       </div>
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
                    {groupId}
                    ({groups.getGroupById(groupId)?.length})
                  </Menu.Item>
                ))}
            </Menu>
            <Button onClick={()=>setIsBrowserRelayPool(!isBrowserRelayPool)}>Explore 500+ relays</Button>
          </Col>
          <Col span={18}>
          <Row>
          <Col span={12}>
            {selectedGroupId}{"("+ groups?.map.get(selectedGroupId!)?.length +")"}
          </Col>
          <Col  span={12}>
          <Input placeholder="Search" prefix={<Icon type='icon-search' />} />
          </Col>
        </Row>
            <div>{renderRightPanel()}</div>
          </Col>
        </Row>
        </>}
        {isBrowserRelayPool && <RelayPool />}
      </Left>
    </BaseLayout>
  );
}

export default RelayManager;

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
