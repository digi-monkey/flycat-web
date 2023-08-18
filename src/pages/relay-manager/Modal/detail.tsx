import { Avatar, Button, Descriptions, Modal, Space } from 'antd';
import { Relay } from 'core/relay/type';
import styles from './detail.module.scss';
import Link from 'next/link';
import { displayTwoDigitNumber } from 'utils/common';
import { useEffect, useState } from 'react';
import { Nip11 } from 'core/nip/11';
import { isRelayOutdate } from 'core/relay/util';
import { RelayPoolDatabase } from 'core/relay/pool/db';

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
  const [uiRelay, setUIRelay] = useState<Relay>();

  useEffect(() => {
    setUIRelay(relay);
    if (isRelayOutdate(relay)) {
      Nip11.updateRelays([relay]).then(detail => {
        if (detail.length > 0){
          const db = new RelayPoolDatabase();
          db.saveAll(detail);
          setUIRelay(detail[0]);
        }
      });
    }
  }, [relay]);

  return (
    <Modal
      title="Relay details"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key={'ok-btn'} type="primary" onClick={onCancel}>
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
          <Descriptions.Item label="About">{uiRelay?.about}</Descriptions.Item>
          <Descriptions.Item label="Status">
            {uiRelay?.isOnline ? 'Online' : 'Offline'}
          </Descriptions.Item>

          <Descriptions.Item label="Nips">
            <div className={styles.nips}>
              {uiRelay?.supportedNips?.map(n => (
                <Link
                  key={n}
                  href={`https://github.com/nostr-protocol/nips/blob/master/${displayTwoDigitNumber(
                    n,
                  )}.md`}
                >
                  {displayTwoDigitNumber(n)}
                </Link>
              ))}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Software">
            {' '}
            {uiRelay?.software}
          </Descriptions.Item>
          <Descriptions.Item label="Contact">{uiRelay?.contact}</Descriptions.Item>
          <Descriptions.Item label="Operator">
            <Space>
              <Avatar src={uiRelay?.operatorDetail?.picture} />
              {uiRelay?.operatorDetail?.name || '...'}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Modal>
  );
};
