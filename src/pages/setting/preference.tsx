import {
  Button,
  Divider,
  List,
  Modal,
  Select,
  Slider,
  Switch,
  Tag,
} from 'antd';
import { dexieDb } from 'core/db';
import { RelayGroup } from 'core/relay/group';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useEffect, useState } from 'react';

export default function Preference() {
  const myPublicKey = useReadonlyMyPublicKey();
  const [storage, setStorage] = useState<number>(0);

  useEffect(()=>{
    updateStorage(); 
  }, []);

  const updateStorage = () => {
    dexieDb.estimateSize().then(setStorage);
  }

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

  return (
    <List size="large">
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
          <Button
            key={'data-cache'}
            onClick={clearLocalDb}
          >
            Delete 
          </Button>,
        ]}
      >
        Local Database(<span>{storage} mb</span>)
      </List.Item>

      <Divider orientation="left">
        <Tag color="error">Below Are Under Construction 🚧</Tag>
      </Divider>

      <Divider orientation="left">Notification</Divider>

      <List.Item actions={[<Switch key={'notify-reply'} defaultChecked />]}>
        When someone replies to your post
      </List.Item>

      <List.Item actions={[<Switch key={'notify-zap'} defaultChecked />]}>
        When someone zaps you
      </List.Item>

      <List.Item actions={[<Switch key={'notify-repost'} defaultChecked />]}>
        When someone repost your notes
      </List.Item>

      <List.Item
        actions={[<Switch key={'notify-repost-long-form'} defaultChecked />]}
      >
        When someone repost your long-form article
      </List.Item>

      <Divider orientation="left">Display</Divider>

      <List.Item actions={[<Switch key={'display-reply'} defaultChecked />]}>
        Display reply context
      </List.Item>

      <List.Item actions={[<Switch key={'display-image'} defaultChecked />]}>
        Show image
      </List.Item>

      <Divider orientation="left">Websocket</Divider>

      <List.Item key={'ws-timeout'}>
        Default websocket timeout seconds <Slider defaultValue={30} />
      </List.Item>

      <Divider orientation="left">Third party provider</Divider>

      <List.Item key={'ws-timeout'}>
        Image Uploader{' '}
        <Select
          defaultValue="nostr.build"
          style={{ width: '150px' }}
          options={[
            { value: 'nostr.build', label: 'nostr.build' },
            { value: 'nostrimg.com', label: 'nostrimg.com/' },
            { value: 'void cat', label: 'void.cat' },
          ]}
        />
      </List.Item>
      <br />
      <br />
      <br />
    </List>
  );
}
