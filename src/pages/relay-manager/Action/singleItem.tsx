import { Dropdown, MenuProps } from 'antd';
import { ActionType, RelayActionModal } from '../Modal/action';
import { Relay } from 'core/relay/type';
import { Dispatch, SetStateAction, useState } from 'react';
import { RelayDetailModal } from '../Modal/detail';
import { RelayGroup } from 'core/relay/group';
import { updateGroupClassState } from '../hooks/useLoadRelayGroup';
import Icon from 'components/Icon';

export interface SingleItemActionProp {
  groupId: string;
  relay: Relay;
  groups: RelayGroup | undefined;
  setGroups: Dispatch<SetStateAction<RelayGroup | undefined>>
}

export const SingleItemAction: React.FC<SingleItemActionProp> = ({
  groupId,
  relay,
  groups,
  setGroups
}) => {
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
        updateGroupClassState(groups!, setGroups);
      },
    },
  ];
  return (
    <>
      <Dropdown menu={{ items }} trigger={['click']}>
        <Icon type='icon-more-horizontal' style={{ cursor: 'pointer',  width: '20px', height: '20px' }} />
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
        relayGroups={groups}
        setRelayGroups={setGroups}
        relays={[relay]}
      />
    </>
  );
};
