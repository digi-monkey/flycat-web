import {
  Button,
  Divider,
  Input,
  List,
  Modal,
  Select,
  Slider,
  Switch,
  Tag,
  message,
} from 'antd';
import { dbEventTable, dexieDb } from 'core/db';
import { RelayGroup } from 'core/relay/group';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useEffect, useState } from 'react';

export default function Preference() {
  const myPublicKey = useReadonlyMyPublicKey();
  const [storage, setStorage] = useState<number>(0);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    updateStorage();
  }, []);

  const updateStorage = () => {
    dexieDb.estimateSize().then(setStorage);
  };

  const resetRelayGroups = () => {
    Modal.confirm({
      title: 'Restore Default Groups',
      content:
        'This will delete all the relay groups you created and can not be undone, are you sure?',
      onOk() {
        const groups = new RelayGroup(myPublicKey);
        groups.store.clean();
        Modal.destroyAll();
      },
      onCancel() {
        Modal.destroyAll();
      },
    });
  };

  const clearLocalDb = () => {
    Modal.confirm({
      title: 'Delete Local Database',
      content:
        'This will delete all local cache data it will not effect usage though, continue?',
      async onOk() {
        await dexieDb.event.clear();
        await dexieDb.profileEvent.clear();
        await dexieDb.contactEvent.clear();
        updateStorage();
      },
      onCancel() {
        Modal.destroyAll();
      },
    });
  };

  const fixLocalDb = async () => {
    messageApi.open({
      type: 'loading',
      content: 'Fixing in progress..',
      duration: 0,
    });
    const length = await dexieDb.fixTableDuplicatedData(dbEventTable);
    updateStorage();
    messageApi.destroy();
    messageApi.open({
      type: 'success',
      content: `${length} duplicated outdated events are removed`,
    });
  };

  return (
    <List size="large">
      <Divider orientation="left">General</Divider>
      {contextHolder}
      <List.Item
        actions={[
          <Button
            key={'restore-groups'}
            disabled={!myPublicKey || myPublicKey.length === 0}
            onClick={resetRelayGroups}
          >
            Restore
          </Button>,
        ]}
      >
        Default Relay Groups
      </List.Item>

      <List.Item
        actions={[
          <Button key={'data-cache'} onClick={clearLocalDb}>
            Delete
          </Button>,
        ]}
      >
        Local Database(<span>{storage} mb</span>)
      </List.Item>

      <List.Item
        actions={[
          <Button key={'data-cache'} onClick={fixLocalDb}>
            Fix
          </Button>,
        ]}
      >
        Fix Local Database
      </List.Item>

      <List.Item
        actions={[
          <Input key={'zap-amount'} disabled value={'21 sats'} size="small" />,
        ]}
      >
        Zap Amount
      </List.Item>
    </List>
  );
}
