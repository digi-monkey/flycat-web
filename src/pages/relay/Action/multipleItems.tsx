import { Relay } from 'core/relay/type';
import styles from './index.module.scss';
import { Button } from 'antd';
import { RelayGroup } from 'core/relay/group';
import { ActionType, RelayActionModal } from '../Modal/action';
import { Dispatch, SetStateAction, useState } from 'react';
import { updateGroupClassState, useLoadRelayGroup } from '../hooks/useLoadRelayGroup';

export interface MultipleItemsActionProp {
  relays: Relay[];
  open: boolean;
  groupId: string;
  groups: RelayGroup | undefined;
  setGroups: Dispatch<SetStateAction<RelayGroup | undefined>>
}

export const MultipleItemsAction: React.FC<MultipleItemsActionProp> = ({
  open,
  relays,
  groupId,
  groups,
  setGroups
}) => {
  const [openActionModal, setOpenActionModal] = useState(false);
  const [actionType, setActionType] = useState(ActionType.copy);
  
  const remove = () => {
    for(const relay of relays){
      groups?.delRelayInGroup(groupId, relay);
      updateGroupClassState(groups!, setGroups);
    }
  }

  const copy = () => {
    setOpenActionModal(true);
    setActionType(ActionType.copy);
  }

  const move = () => {
    setOpenActionModal(true);
    setActionType(ActionType.move);
  }

  return (
    <div
      className={
        styles.actionFooterContainer + `${open ? ' ' + styles.active : ''}`
      }
    >
      <div className={styles.actionFooter}>
        <div className={styles.selectText}>{relays.length} selected</div>
        <div className={styles.btnGroups}>
          <Button onClick={remove}>Remove</Button>
          <Button onClick={copy}>Copy to</Button>
          <Button onClick={move}>Move to</Button>
        </div>
      </div>
      
      <RelayActionModal
        groupId={groupId}
        type={actionType}
        open={openActionModal}
        onCancel={() => setOpenActionModal(false)}
        relayGroups={groups}
        setRelayGroups={setGroups}
        relays={relays}
      />
    </div>
  );
};
