import { Relay } from 'core/relay/type';
import { RelayGroupManager as RelayGroupClass } from 'core/relay/group';
import styles from './index.module.scss';
import { Button } from 'antd';
import { ActionType, RelayActionModal } from '../Modal/action';
import { Dispatch, SetStateAction, useState } from 'react';

export interface MultipleItemsPoolActionProp {
  relays: Relay[];
  open: boolean;
  groups: RelayGroupClass | undefined;
  setGroups: Dispatch<SetStateAction<RelayGroupClass | undefined>>;
}

export const MultipleItemsPoolAction: React.FC<MultipleItemsPoolActionProp> = ({
  open,
  relays,
  groups,
  setGroups,
}) => {
  const [openActionModal, setOpenActionModal] = useState(false);

  const addTo = () => {
    setOpenActionModal(true);
  };

  return (
    <div
      className={
        styles.actionFooterContainer + `${open ? ' ' + styles.active : ''}`
      }
    >
      <div className={styles.actionFooter}>
        <div className={styles.selectText}>{relays.length} selected</div>
        <div className={styles.btnGroups}>
          <Button onClick={addTo}>Add to</Button>
        </div>
      </div>

      <RelayActionModal
        relayGroups={groups}
        setRelayGroups={setGroups}
        type={ActionType.copy}
        open={openActionModal}
        onCancel={() => setOpenActionModal(false)}
        relays={relays}
      />
    </div>
  );
};
