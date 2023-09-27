import { Avatar, Dropdown, Modal, message } from 'antd';
import type { MenuProps } from 'antd';
import styles from './index.module.scss';
import classNames from 'classnames';
import Link from 'next/link';
import { Paths } from 'constants/path';
import { useTimeSince } from 'hooks/useTimeSince';
import Icon from 'components/Icon';
import {
  copyToClipboard,
  requestPublicKeyFromNip05DomainName,
} from 'utils/common';
import { Nip19, Nip19DataType } from 'core/nip/19';
import { EventWithSeen } from 'pages/type';
import { Event } from 'core/nostr/Event';
import { useEffect, useState } from 'react';
import { isValidPublicKey } from 'utils/validator';
import { isNip05DomainName } from 'core/nip/05';

interface PostUserProps {
  publicKey: string;
  avatar: string;
  nip05name?: string;
  name: string | React.ReactNode;
  descNodes?: React.ReactNode;
  child?: boolean;
  time?: number;
  event: EventWithSeen;
  extraMenu?: {
    label: string;
    onClick: (event: Event, msg: typeof message) => any;
  }[];
}

const PostUser: React.FC<PostUserProps> = ({
  publicKey,
  avatar,
  name,
  nip05name,
  time,
  descNodes,
  event,
  child = false,
  extraMenu,
}) => {
  const timeSince = useTimeSince(time || 0);

  const items: MenuProps['items'] = [
    {
      label: 'copy note id',
      key: '0',
      onClick: () => {
        try {
          copyToClipboard(Nip19.encode(event.id, Nip19DataType.EventId));
          message.success('note id copy to clipboard!');
        } catch (error: any) {
          message.error(`note id copy failed! ${error.message}`);
        }
      },
    },
    {
      label: 'copy note JSON ',
      key: '1',
      onClick: () => {
        try {
          copyToClipboard(JSON.stringify(event));
          message.success('note JSON copy to clipboard!');
        } catch (error: any) {
          message.error(`note JSON copy failed! ${error.message}`);
        }
      },
    },
    {
      label: 'copy user public key',
      key: '2',
      onClick: () => {
        try {
          copyToClipboard(publicKey);
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
  const [userUrl, setUserUrl] = useState<string>(`${Paths.user + publicKey}`);
  
  useEffect(() => {
    if (nip05name && isNip05DomainName(nip05name)) {
      // todo: find a better way to validate and cache the result for nip05 before use it
      setUserUrl(`${Paths.user + nip05name}`);
    }
  }, [nip05name]);

  return (
    <div
      className={classNames(styles.postUser, {
        [styles.child]: child,
      })}
    >
      <div className={styles.user}>
        <Link href={userUrl}>
          <Avatar src={avatar} alt="picture" />
        </Link>
        <div className={styles.info}>
          {typeof name === 'string' ? (
            <Link href={userUrl}>{name}</Link>
          ) : (
            <Link href={userUrl}>{'...'}</Link>
          )}
          {!child && (
            <p>
              <span>{descNodes}</span>
              {time && <time>{timeSince}</time>}
            </p>
          )}
        </div>
      </div>
      <div className={styles.slot}>
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
          <Icon type="icon-more-vertical" className={styles.more} />
        </Dropdown>
      </div>
    </div>
  );
};

export default PostUser;
