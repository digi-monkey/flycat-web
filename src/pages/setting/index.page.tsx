import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import {
  EventSetMetadataContent,
  Nostr,
  WellKnownEventKind,
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { connect, useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { ImageUploader } from 'components/ImageUploader';
import { useCallWorker } from 'hooks/useWorker';
import { CallRelayType } from 'core/worker/type';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { loginMapStateToProps } from 'pages/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Avatar, Button, Empty, Form, Input, List, Tabs } from 'antd';
import { noticePubEventResult } from 'components/PubEventNotice';

import PageTitle from 'components/PageTitle';
import styles from './index.module.scss';
import Preference from './preference';
import About from './about';
import { useRouter } from 'next/router';

const { TextArea } = Input;

interface FormData {
  name?: string;
  username?: string;
  about?: string;
  website?: string;
  bitcoinLightningAddress?: string;
  bitcoinLightningAddressLud16?: string;
  domainNameVerification?: string;
}

export const EditProfilePage = ({ commitId }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const tabKey = router.query.tabKey as (string | undefined) || "account";
  const handleTabChange = (key) => {
    router.push(`?tabKey=${key}`); // Update the query parameter in the URL when the tab changes
  };

  const myPublicKey = useReadonlyMyPublicKey();
  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );
  const [profile, setProfile] = useState<
    EventSetMetadataContent & { created_at: number }
  >();

  const [formData, setFormData] = useState<FormData>();
  const [avatar, setAvatar] = useState<string | undefined>(profile?.picture);
  const [banner, setBanner] = useState<string | undefined>(profile?.banner);

  const { worker, newConn } = useCallWorker();

  function handleEvent(event: Event, relayUrl?: string) {
    if (event.pubkey !== myPublicKey) return;

    if (event.kind === WellKnownEventKind.set_metadata) {
      const metadata: EventSetMetadataContent = JSON.parse(event.content);
      setProfile(prev => {
        if (prev?.created_at && prev.created_at >= event.created_at) {
          return prev!;
        }

        return {
          ...metadata,
          ...{ created_at: event.created_at },
        } as unknown as EventSetMetadataContent & { created_at: number };
      });

      return;
    }
  }

  useEffect(() => {
    if (newConn.length === 0) return;
    if (myPublicKey == null) return;
    if (!worker) return;

    worker
      .subMetadata([myPublicKey], undefined, {
        type: CallRelayType.batch,
        data: newConn,
      })
      .iterating({ cb: handleEvent });
  }, [worker, newConn, myPublicKey]);

  useEffect(() => {
    if (profile == null) return;

    const data: FormData = {
      name: profile.display_name,
      username: profile.name,
      about: profile.about,
      website: profile.website,
      bitcoinLightningAddress: profile.lud06,
      bitcoinLightningAddressLud16: profile.lud16,
      domainNameVerification: profile.nip05,
    };
    setFormData(data);
    setAvatar(profile.picture);
    setBanner(profile.banner);
  }, [profile]);

  const onFormSubmit = async (formData: FormData) => {
    if (signEvent == null) {
      return alert('no sign method!');
    }
    if (worker == null) {
      return alert('something went wrong, please try again.');
    }

    const data: EventSetMetadataContent = {
      name: formData.username || '',
      display_name: formData.name || '',
      about: formData.about || '',
      picture: avatar || '',
      lud06: formData.bitcoinLightningAddress || '',
      lud16: formData.bitcoinLightningAddressLud16 || '',
      website: formData.website || '',
      banner: banner || '',
      nip05: formData.domainNameVerification || '',
    };
    console.log(data);
    const rawEvent = await Nostr.newProfileRawEvent(data);
    const event = await signEvent(rawEvent);
    const handler = worker.pubEvent(event);
    noticePubEventResult(handler);
  };

  const items = [
    {
      label: `Account`,
      key: 'account',
      children: (
        <div className={styles.accountContainer}>
          {formData ? (
            <Form
              layout="vertical"
              onFinish={onFormSubmit}
              initialValues={formData}
            >
              <Form.Item>
                <div>
                  <Avatar
                    style={{ width: '64px', height: '64px' }}
                    src={avatar}
                  />
                  {avatar && (
                    <Button type="link" onClick={() => setAvatar(undefined)}>
                      Remove
                    </Button>
                  )}
                  <ImageUploader
                    onImgUrls={(imgs: string[]) =>
                      setAvatar(imgs[imgs.length - 1])
                    }
                  />
                </div>
              </Form.Item>

              <Form.Item label={t('profileEditPanel.username')} name="username">
                <Input placeholder={formData.username} />
              </Form.Item>

              <Form.Item label={t('profileEditPanel.displayName')} name="name">
                <Input type="text" />
              </Form.Item>

              <Form.Item label={t('profileEditPanel.about')} name="about">
                <TextArea />
              </Form.Item>

              <Form.Item label={t('profileEditPanel.banner')}>
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

              <Form.Item label={t('profileEditPanel.website')} name="website">
                <Input />
              </Form.Item>

              <Form.Item
                label={t('profileEditPanel.btcLightningAddress')}
                name="bitcoinLightningAddress"
              >
                <Input />
              </Form.Item>

              <Form.Item
                label={t('profileEditPanel.lud16')}
                name="bitcoinLightningAddressLud16"
              >
                <Input />
              </Form.Item>

              <Form.Item
                label={t('profileEditPanel.domainNameVerification')}
                name="domainNameVerification"
              >
                <Input />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Empty />
          )}
        </div>
      ),
    },
    {
      label: `Preference`,
      key: 'preference',
      children: (
        <div>
          <Preference />
        </div>
      ),
    },
    {
      label: 'About',
      key: 'about',
      children: <About commitId={commitId} />,
    },
  ];

  return (
    <BaseLayout>
      <Left>
        <PageTitle title="Settings" />
        <Tabs centered items={items} activeKey={tabKey} onChange={handleTabChange} />
      </Left>
      <Right></Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(EditProfilePage);

export const getStaticProps = async ({ locale }: { locale: string }) => {
  const commitId = process.env.REACT_APP_COMMIT_HASH;

  return {
    props: {
      commitId,
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};
