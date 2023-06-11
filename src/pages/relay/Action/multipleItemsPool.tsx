import { Relay } from 'service/relay/type';
import styles from './index.module.scss';
import { Button } from 'antd';
import { ActionType, RelayActionModal } from '../Modal/action';
import { useState } from 'react';

export interface MultipleItemsPoolActionProp {
  relays: Relay[];
  open: boolean;
}

export const MultipleItemsPoolAction: React.FC<MultipleItemsPoolActionProp> = ({
  open,
  relays,
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
        type={ActionType.copy}
        open={openActionModal}
        onCancel={() => setOpenActionModal(false)}
        relays={relays}
      />
    </div>
  );
};
