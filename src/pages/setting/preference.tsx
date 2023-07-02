import { Divider, List, Select, Slider, Switch, Tag } from 'antd';

export default function Preference() {
  return (
    <List size="large">
      <Divider orientation="left">
        <Tag color="error">Page Under Construction 🚧</Tag>
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
