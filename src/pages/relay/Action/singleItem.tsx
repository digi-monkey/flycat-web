import { EllipsisOutlined } from '@ant-design/icons';
import { Dropdown, MenuProps } from 'antd';
import { ActionType, RelayActionModal } from '../Modal/action';
import { Relay } from 'service/relay/type';
import { useState } from 'react';
import { RelayDetailModal } from '../Modal/detail';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useDefaultGroup } from '../hooks/useDefaultGroup';
import { useRelayGroup } from '../hooks/useRelayGroup';

export interface SingleItemActionProp {
  groupId: string;
  relay: Relay;
}

export const SingleItemAction: React.FC<SingleItemActionProp> = ({
  groupId,
  relay,
}) => {
  const myPublicKey = useReadonlyMyPublicKey();
  const defaultGroups = useDefaultGroup();
  const groups = useRelayGroup(myPublicKey, defaultGroups);

  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openActionModal, setOpenActionModal] = useState(false);
  const [actionType, setActionType] = useState(ActionType.copy);

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: <span>View details</span>,
      onClick: () => {
        setOpenDetailModal(true);
      },
    },
    {
      key: '2',
      label: <span>Copy to</span>,
      onClick: () => {
        setOpenActionModal(true);
        setActionType(ActionType.copy);
      },
    },
    {
      key: '3',
      label: <span>Move to</span>,
      onClick: () => {
        setOpenActionModal(true);
        setActionType(ActionType.move);
      },
    },
    {
      key: '4',
      label: <span>Remove from group</span>,
      onClick: () => {
        groups?.delRelayInGroup(groupId, relay);
        alert('removed!');
      },
    },
  ];
  return (
    <>
      <Dropdown menu={{ items }} trigger={['click']}>
        <EllipsisOutlined style={{ cursor: 'pointer' }} />
      </Dropdown>

      <RelayDetailModal
        relay={relay}
        open={openDetailModal}
        onCancel={() => setOpenDetailModal(false)}
      />

      <RelayActionModal
        type={actionType}
        open={openActionModal}
        onCancel={() => setOpenActionModal(false)}
        relays={[relay]}
      />
    </>
  );
};
