import {
  Button,
  Divider,
  Input,
  List,
  Modal,
  Progress,
  Select,
  Slider,
  Switch,
  Tag,
  Upload,
  message,
} from 'antd';
import { dbEventTable, dexieDb } from 'core/db';
import { RelayGroupManager } from 'core/relay/group';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useEffect, useState } from 'react';
import { exportDB } from 'dexie-export-import';

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
        const groups = new RelayGroupManager(myPublicKey);
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

  const exportDb = async () => {
    const blob = await exportDB(dexieDb);
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'nostr-database.json';
    link.innerHTML = 'Click here to download the file';
    link.click();
  };

  const importDb = async (blob: Blob) => {
    try {
      const key = 'loading';
      const loadingMessage = message.loading({
        content: 'import db, please wait..',
        key,
        duration: 0,
      });

      // Function to close the loading message when called
      const closeLoadingMessage = () => {
        message.destroy(key);
      };

      await dexieDb.import(blob, {
        overwriteValues: true,
        progressCallback: progress => {
          if (progress.done) {
            closeLoadingMessage();
          }
          return true;
        },
      });

      messageApi.success('import success!');
    } catch (error: any) {
      messageApi.error('import failed, ' + error.message);
    }
  };

  const handleFileChange = (info: any) => {
    if (info.file.status === 'done') {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          const blob = new Blob([reader.result], { type: info.file.type });
          console.log('File Blob:', blob);
          importDb(blob);
        }
      };
      reader.readAsArrayBuffer(info.file.originFileObj);
    }
  };

  return (
    <List size="large">
      {contextHolder}
      <Divider orientation="left">General</Divider>
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
          <Input key={'zap-amount'} disabled value={'21 sats'} size="small" />,
        ]}
      >
        Zap Amount
      </List.Item>

      <Divider orientation="left">Database</Divider>
      <List.Item
        actions={[
          <Button key={'data-delete'} onClick={clearLocalDb}>
            Delete
          </Button>,
        ]}
      >
        Local Database(<span>{storage} mb</span>)
      </List.Item>

      <List.Item
        actions={[
          <Button key={'data-fix'} onClick={fixLocalDb}>
            Check
          </Button>,
        ]}
      >
        Fix Local Database
      </List.Item>

      <List.Item
        actions={[
          <Button key={'data-export'} onClick={exportDb}>
            Export
          </Button>,
        ]}
      >
        Export Local Database
      </List.Item>

      <List.Item
        actions={[
          <Upload
            customRequest={({ file, onSuccess }: any) => {
              if (onSuccess && file) onSuccess('ok', file);
            }}
            key={'data-import'}
            onChange={handleFileChange}
            showUploadList={true}
          >
            <Button>Upload</Button>
          </Upload>,
        ]}
      >
        Import Local Database via JSON file
      </List.Item>
    </List>
  );
}
