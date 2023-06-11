import { Relay } from 'service/relay/type';
import styles from './index.module.scss';
import { Button } from 'antd';

export interface MultipleItemsActionProp {
  relays: Relay[];
  open: boolean;
}

export const MultipleItemsAction: React.FC<MultipleItemsActionProp> = ({
  open,
  relays,
}) => {
  return (
    <div
      className={
        styles.actionFooterContainer + `${open ? ' ' + styles.active : ''}`
      }
    >
      <div className={styles.actionFooter}>
        <Button>Move to</Button>
        <Button>Copy to</Button>
        <Button>Move to</Button>
      </div>
    </div>
  );
};
