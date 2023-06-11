import { Relay } from 'service/relay/type';
import styles from './index.module.scss';
import { Button } from 'antd';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useDefaultGroup } from '../hooks/useDefaultGroup';
import { useRelayGroup } from '../hooks/useRelayGroup';
import { ActionType, RelayActionModal } from '../Modal/action';
import { useState } from 'react';

export interface MultipleItemsActionProp {
  relays: Relay[];
  open: boolean;
  groupId: string;
}

export const MultipleItemsAction: React.FC<MultipleItemsActionProp> = ({
  open,
  relays,
  groupId
}) => {
  const myPublicKey = useReadonlyMyPublicKey();
  const defaultGroups = useDefaultGroup();
  const groups = useRelayGroup(myPublicKey, defaultGroups);

  const [openActionModal, setOpenActionModal] = useState(false);
  const [actionType, setActionType] = useState(ActionType.copy);
  
  const remove = () => {
    for(const relay of relays){
      groups?.delRelayInGroup(groupId, relay);
    }

    alert("removed!");
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
        relays={relays}
      />
    </div>
  );
};
