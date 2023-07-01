import { Modal } from 'antd';
import { Relay } from 'core/relay/type';

export interface RelayDetailModalProp {
  relay: Relay;
  open: boolean;
  onCancel: any;
}

export const RelayDetailModal: React.FC<RelayDetailModalProp> = ({
  relay,
  open,
  onCancel,
}) => {
  return (
    <Modal
      title="Relay details"
      open={open}
      onCancel={onCancel}
      onOk={onCancel}
      okText={'Got it'}
      // Remove the footer (cancel button)
      //footer={[<button key="submit" onClick={handleCloseModal}>OK</button>]}
    >
      {/* Render modal content using selectedRowData */}
      <>
        <p>{relay.url}</p>
        <p>{relay.about}</p>
        <p>{relay.software}</p>
        <p>{relay.supportedNips?.join(', ')}</p>
        <p>{relay.contact}</p>
        <p>{relay.area}</p>
        <p>{relay.operator}</p>
      </>
    </Modal>
  );
};
