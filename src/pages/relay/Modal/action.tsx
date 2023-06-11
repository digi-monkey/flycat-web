import { Modal } from 'antd';
import { Relay } from 'service/relay/type';
import { Input, List, Checkbox } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useDefaultGroup } from '../hooks/useDefaultGroup';
import { useRelayGroup } from '../hooks/useRelayGroup';

export interface Group {
  id: string;
  name: string;
  itemCount: number;
  selected: boolean;
}

export enum ActionType {
  copy,
  move,
}

export interface RelayActionModalProp {
  relays: Relay[];
  open: boolean;
  onCancel: any;
  type: ActionType;
}

export const RelayActionModal: React.FC<RelayActionModalProp> = ({
  type,
  relays,
  open,
  onCancel,
}) => {
  const title =
    type === ActionType.copy
      ? `Copy ${relays.length} relays to`
      : `Move  ${relays.length} relays to`;
  const description =
    type === ActionType.copy
      ? `Select the groups that you want to copy to`
      : `Select the groups that you want to move to`;

  const myPublicKey = useReadonlyMyPublicKey();
  const defaultGroups = useDefaultGroup();
  const relayGroups = useRelayGroup(myPublicKey, defaultGroups);

  const toGroup = () => {
    return relayGroups?.getAllGroupIds().map(id => {
      return {
        id: id,
        name: id,
        itemCount: relayGroups.getGroupById(id)?.length || 0,
        selected: false,
      };
    });
  };

  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(()=>{
    const groups = toGroup() || [];
    setGroups(groups);
  }, [relayGroups])

  const handleCheckboxChange = (groupId: string) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          selected: !group.selected,
        };
      }
      return group;
    });
    setGroups(updatedGroups);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewGroupName(e.target.value);
  };

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      const newGroup: Group = {
        id: newGroupName,
        name: newGroupName,
        itemCount: 0,
        selected: false,
      };
      setGroups([...groups, newGroup]);
      setNewGroupName('');
    }
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={onCancel}
      okText={'Got it'}
      // Remove the footer (cancel button)
      //footer={[<button key="submit" onClick={handleCloseModal}>OK</button>]}
    >
      {
        <>
          <p>{description}</p>

          <List
            dataSource={groups}
            renderItem={group => (
              <List.Item key={group.id}>
                <Checkbox
                  checked={group.selected}
                  onChange={() => handleCheckboxChange(group.id)}
                >
                  <CheckOutlined />
                </Checkbox>
                <span style={{ marginLeft: 8 }}>{group.name}</span>
                <span style={{ marginLeft: 8 }}>({group.itemCount} items)</span>
              </List.Item>
            )}
          />
          <Input
            value={newGroupName}
            onChange={handleInputChange}
            onPressEnter={handleAddGroup}
            placeholder="Enter group name"
            style={{ marginTop: 16 }}
          />
        </>
      }
    </Modal>
  );
};
