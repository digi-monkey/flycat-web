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
import { RelayGroup } from 'core/relay/group';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';

export default function Preference() {
  const myPublicKey = useReadonlyMyPublicKey();
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
  return (
    <List size="large">
      <Divider orientation="left">Relay Groups</Divider>

      <List.Item
        actions={[
          <Button
            key={'restore-groups'}
            disabled={!myPublicKey || myPublicKey.length === 0}
            onClick={resetRelayGroups}
          >
            Reset
          </Button>,
        ]}
      >
        Restore Default
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
