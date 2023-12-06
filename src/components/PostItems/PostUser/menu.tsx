import type { MenuProps } from 'antd';
import { Dropdown, Modal, message } from 'antd';

import styles from './index.module.scss';
import Icon from 'components/Icon';

export function PostUserMenu({ event, publicKey, extraMenu }) {
  const items: MenuProps['items'] = [
    {
      label: 'copy note id',
      key: '0',
      onClick: async () => {
        try {
          const { copyToClipboard } = await import('utils/common');
          const { Nip19, Nip19DataType } = await import('core/nip/19');
          await copyToClipboard(Nip19.encode(event.id, Nip19DataType.EventId));
          message.success('note id copy to clipboard!');
        } catch (error: any) {
          message.error(`note id copy failed! ${error.message}`);
        }
      },
    },
    {
      label: 'copy note JSON ',
      key: '1',
      onClick: async () => {
        try {
          const { copyToClipboard } = await import('utils/common');
          await copyToClipboard(JSON.stringify(event));
          message.success('note JSON copy to clipboard!');
        } catch (error: any) {
          message.error(`note JSON copy failed! ${error.message}`);
        }
      },
    },
    {
      label: 'copy user public key',
      key: '2',
      onClick: async () => {
        try {
          const { copyToClipboard } = await import('utils/common');
          await copyToClipboard(publicKey);
          message.success('public key copy to clipboard!');
        } catch (error: any) {
          message.error(`public key copy failed! ${error.message}`);
        }
      },
    },
    {
      type: 'divider',
    },
    {
      label: 'relays',
      key: '3',
      onClick: () => {
        Modal.success({
          title: 'Seen on Relays',
          content: event.seen?.map(r => <p key={r}>{r}</p>),
        });
      },
    },
  ];

  if (extraMenu) {
    for (const option of extraMenu) {
      items.push({
        label: option.label,
        key: (items.length + 1).toString(),
        onClick: () => {
          option.onClick(event, message);
        },
      });
    }
  }

  return (
    <div className={styles.slot}>
      <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
        <Icon type="icon-more-vertical" className={styles.more} />
      </Dropdown>
    </div>
  );
}
