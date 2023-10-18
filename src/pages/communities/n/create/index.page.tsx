import { Avatar, Button, Form, Input, Select } from 'antd';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { ImageUploader } from 'components/ImageUploader';
import { useEffect, useState } from 'react';

import styles from './index.module.scss';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  EventContactListPTag,
  EventSetMetadataContent,
  EventTags,
  PublicKey,
  UserMap,
  WellKnownEventKind,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { CommunityMetadata, Nip172 } from 'core/nip/172';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { noticePubEventResult } from 'components/PubEventNotice';
import {
  deserializeMetadata,
  shortifyNPub,
} from 'core/nostr/content';
import { createCallRelay } from 'core/worker/util';
import { Nip19, Nip19DataType } from 'core/nip/19';
import { useRouter } from 'next/router';

const { TextArea } = Input;

interface FormData {
  name?: string;
  description?: string;
  rules?: string;
  banner?: string;
  moderators?: PublicKey[];
  author?: PublicKey;
}

export default function CreateCommunity() {
  const router = useRouter();
  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn } = useCallWorker();
  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );
  const [banner, setBanner] = useState<string>();
  const [formData, setFormData] = useState<FormData>();
  const [moderators, setModerators] = useState<PublicKey[]>([]);

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [userContactList, setUserContactList] = useState<{
    keys: PublicKey[];
    created_at: number;
  }>({ keys: [], created_at: 0 });

  function handleEvent(event: Event, relayUrl?: string) {
    if (event.kind === WellKnownEventKind.set_metadata) {
      const metadata: EventSetMetadataContent = deserializeMetadata(
        event.content,
      );
      setUserMap(prev => {
        const newMap = new Map(prev);
        const oldData = newMap.get(event.pubkey);
        if (oldData && oldData.created_at > event.created_at) return newMap;

        newMap.set(event.pubkey, {
          ...metadata,
          ...{ created_at: event.created_at },
        });

        return newMap;
      });
    }

    if (event.kind === WellKnownEventKind.contact_list) {
      if (event.pubkey === myPublicKey) {
        setUserContactList(prev => {
          if (prev && prev?.created_at >= event.created_at) return prev;

          const keys = (
            event.tags.filter(
              t => t[0] === EventTags.P,
            ) as EventContactListPTag[]
          ).map(t => t[1]);

          return {
            keys: Array.from(new Set(keys)),
            created_at: event.created_at,
          };
        });
      }
    }
  }

  useEffect(() => {
    if (!worker) return;

    const pks = userContactList?.keys || [];
    if (myPublicKey.length > 0) pks.push(myPublicKey);
    if (pks.length === 0) return;

    const callRelay = createCallRelay(newConn);
    worker
      .subMetaDataAndContactList(pks, undefined, callRelay)
      .iterating({ cb: handleEvent });
  }, [newConn, myPublicKey, worker]);

  const onFinish = async value => {
    if (!signEvent) return;
    if (!worker) return;

    const metadata: CommunityMetadata = {
      id: value?.name || '',
      image: banner || '',
      description: value?.description || '',
      rules: value?.rules || '',
      creator: myPublicKey,
      moderators: moderators,
    };
    console.log(formData, metadata);
    const raw = Nip172.createCommunityRawEvent(metadata);
    const event = await signEvent(raw);

    const handler = worker.pubEvent(event);
    noticePubEventResult(handler);
    router.push(
      '/communities/n/' +
      encodeURIComponent(
        Nip172.communityAddr({
          identifier: metadata.id,
          author: metadata.creator,
        }),
      ),
    );
  };

  return (
    <BaseLayout>
      <Left>
        <div className={styles.form}>
          <div className={styles.title}>Create new community</div>
          <Form
            layout="vertical"
            onFinish={onFinish}
            initialValues={formData}
            key={JSON.stringify(formData)} // force re-render when formData changed
          >
            <Form.Item label={'name'} name="name">
              <Input type="text" />
            </Form.Item>

            <Form.Item label={'description'} name="description">
              <TextArea />
            </Form.Item>

            <Form.Item label={'rules'} name="rules">
              <Input />
            </Form.Item>

            <Form.Item label={'banner'}>
              <div>
                <img src={banner} className={styles.banner} />
                {banner && (
                  <Button type="link" onClick={() => setBanner(undefined)}>
                    Remove
                  </Button>
                )}
                <ImageUploader
                  onImgUrls={(imgs: string[]) =>
                    setBanner(imgs[imgs.length - 1])
                  }
                />
              </div>
            </Form.Item>

            <Form.Item label={'moderators'} name="moderators">
              <Select
                onChange={pks =>
                  setModerators(prev => {
                    const newData = prev;
                    const newPks = pks.filter(pk => !newData.includes(pk));
                    return newData.concat(newPks);
                  })
                }
                mode="tags"
                showSearch
                filterOption={(input, option) =>
                  (userMap.get(option?.value ?? '')?.name ?? '')
                    .toLocaleLowerCase()
                    .includes(input)
                }
                options={userContactList.keys.map(pk => {
                  return {
                    label: (
                      <div>
                        <Avatar src={userMap.get(pk)?.picture} />
                        {userMap.get(pk)?.name}
                        {`(${shortifyNPub(
                          Nip19.encode(pk, Nip19DataType.Npubkey),
                        )})`}
                      </div>
                    ),
                    value: pk,
                  };
                })}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
