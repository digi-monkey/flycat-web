import { Avatar, Button, Descriptions, Modal, Space } from 'antd';
import { Relay } from 'core/relay/type';
import styles from './detail.module.scss';
import Link from 'next/link';
import { displayTwoDigitNumber } from 'utils/common';

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
      footer={[
        <Button key={"ok-btn"} type="primary" onClick={onCancel}>
          Got it
        </Button>,
      ]}
    >
      <div className={styles.detailBox}>
        <Descriptions
          colon={false}
          column={1}
          layout="vertical"
          labelStyle={{
            color: '#1E1E1E',
            fontSize: '14px',
            fontFamily: 'Noto Sans',
            fontWeight: '700',
            lineHeight: '22px',
          }}
        >
          <Descriptions.Item label="Url">{relay.url}</Descriptions.Item>
          <Descriptions.Item label="About">{relay.about}</Descriptions.Item>
          <Descriptions.Item label="Status">{relay.isOnline ? "Online" : "Offline"}</Descriptions.Item>

          <Descriptions.Item label="Nips">
            <div className={styles.nips}>
              {relay.supportedNips?.map(n =>
                <Link key={n} href={`https://github.com/nostr-protocol/nips/blob/master/${displayTwoDigitNumber(n)}.md`}>{displayTwoDigitNumber(n)}</Link>
              )}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Software">
            {' '}
            {relay.software}
          </Descriptions.Item>
          <Descriptions.Item label="Contact">{relay.contact}</Descriptions.Item>
          <Descriptions.Item label="Operator" >
            <Space>
            <Avatar src={relay.operatorDetail?.picture} />
            {relay.operatorDetail?.name || '...'}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Modal>
  );
};
