import { Modal } from 'antd';
import { Relay } from 'core/relay/type';
import { Input, List, Checkbox } from 'antd';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useDefaultGroup } from '../hooks/useDefaultGroup';
import { useRelayGroup } from '../hooks/useRelayGroup';
import { RelayGroup } from 'core/relay/group';
import { updateGroupClassState } from '../hooks/useLoadRelayGroup';

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
  groupId?: string;
  relays: Relay[];
  open: boolean;
  onCancel: any;
  type: ActionType;
  relayGroups: RelayGroup | undefined;
  setRelayGroups: Dispatch<SetStateAction<RelayGroup | undefined>>;
}

export const RelayActionModal: React.FC<RelayActionModalProp> = ({
  type,
  groupId,
  relays,
  open,
  onCancel,
  relayGroups,
  setRelayGroups
}) => {
  const title =
    type === ActionType.copy
      ? `Copy ${relays.length} relays to`
      : `Move  ${relays.length} relays to`;
  const description =
    type === ActionType.copy
      ? `Select the groups that you want to copy to`
      : `Select the groups that you want to move to`;

  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');

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

  useEffect(() => {
    const groups = toGroup() || [];
    setGroups(groups);
  }, [relayGroups]);

  const onClickOk =
    type === ActionType.copy
      ? () => {
          const selectGroupIds = groups.filter(g => g.selected).map(g => g.id);
          for (const selectGroupId of selectGroupIds) {
            for (const relay of relays) {
              relayGroups?.addNewRelayToGroup(selectGroupId, relay);
              updateGroupClassState(relayGroups!, setRelayGroups);
            }
          }
          onCancel();
        }
      : () => {
          if (groupId == null) return alert('group id is null!');
          const selectGroupIds = groups.filter(g => g.selected).map(g => g.id);
          for (const selectGroupId of selectGroupIds) {
            for (const relay of relays) {
              relayGroups?.addNewRelayToGroup(selectGroupId, relay);
              updateGroupClassState(relayGroups!, setRelayGroups);
            }
          }
          for (const relay of relays) {
            relayGroups?.delRelayInGroup(groupId, relay);
            updateGroupClassState(relayGroups!, setRelayGroups);
          }
          onCancel();
        };

  const okText = type === ActionType.copy ? "Copy" : "Move";

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={onClickOk}
      okText={okText}
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
                ></Checkbox>
                <span style={{ marginLeft: 8 }}>{group.name}</span>
                <span style={{ marginLeft: 8 }}>({group.itemCount} items)</span>
              </List.Item>
            )}
          />
          <Input
            value={newGroupName}
            onChange={handleInputChange}
            onPressEnter={handleAddGroup}
            placeholder="Enter new group name"
            style={{ marginTop: 16 }}
          />
        </>
      }
    </Modal>
  );
};
