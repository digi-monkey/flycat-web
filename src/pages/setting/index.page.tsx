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
import { Form, Input, Tabs } from 'antd';
import { noticePubEventResult } from 'components/PubEventNotice';
import { useRouter } from 'next/router';
import { useToast } from 'components/shared/ui/Toast/use-toast';

import dynamic from 'next/dynamic';
import PageTitle from 'components/PageTitle';
import styles from './index.module.scss';
import Key from './key';
import { Button } from 'components/shared/ui/Button';
import Avatar from 'components/shared/ui/Avatar';

const Preference = dynamic(() => import('./preference'), {
  ssr: false,
});

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
  const { toast } = useToast();
  const tabKey = (router.query.tabKey as string | undefined) || 'account';
  const handleTabChange = key => {
    router.push(`?tabKey=${key}`); // Update the query parameter in the URL when the tab changes
  };

  const myPublicKey = useReadonlyMyPublicKey();
  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );
  const isLoggedIn = useSelector(
    (state: RootState) => state.loginReducer.isLoggedIn,
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
    noticePubEventResult(toast, worker.relays.length, handler);
  };

  const items = [
    {
      label: `Profile`,
      key: 'account',
      children: (
        <div className={styles.accountContainer}>
          <Form
            layout="vertical"
            onFinish={onFormSubmit}
            initialValues={formData}
            key={JSON.stringify(formData)} // force re-render when formData changed
          >
            <Form.Item>
              <div>
                <Avatar src={avatar} />
                {avatar && (
                  <Button variant="link" onClick={() => setAvatar(undefined)}>
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
              <Input />
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
                  <Button variant="link" onClick={() => setBanner(undefined)}>
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
              <Button type="submit">Submit</Button>
            </Form.Item>
          </Form>
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
      label: 'Keys',
      key: 'keys',
      children: <Key />,
    },
  ];

  return (
    <BaseLayout>
      <Left>
        <PageTitle title="Settings" />
        {isLoggedIn ? (
          <Tabs
            centered
            items={items}
            activeKey={tabKey}
            onChange={handleTabChange}
          />
        ) : (
          <Preference />
        )}
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
