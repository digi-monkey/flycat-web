import { Button, Grid } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EventSetMetadataContent,
  EventSubResponse,
  isEventSubResponse,
  Nip19DataType,
  nip19Encode,
  Nostr,
  WellKnownEventKind,
} from 'service/api';
import styled from 'styled-components';
import { connect, useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { ImageUploader } from 'app/components/layout/PubNoteTextarea';
import {
  ProfileAvatar,
  ProfileBanner,
} from 'app/components/layout/msg/TextMsg';
import { useCallWorker } from 'hooks/useWorker';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { CallRelayType } from 'service/worker/type';
import { BaseLayout, Left } from 'app/components/layout/BaseLayout';
import { CopyText } from 'app/components/layout/util/CopyText';
import { loginMapStateToProps } from 'app/helper';
import { ThinHr } from 'app/components/layout/ThinHr';
import { useCommitId } from 'hooks/useCommitId';
import { useVersion } from 'hooks/useVersion';

const styles = {
  userInfo: {
    paddingRight: '10px',
    //paddingBottom: '10px',
    textAlign: 'right' as const,
    background: 'white',
  },
  avatar: {
    width: '48px',
    height: '48px',
  },
  name: {
    marginLeft: '20px',
    fontSize: '20px',
    fontWeight: '500',
  },
  about: {
    color: 'gray',
    margin: '10px 0px',
    display: 'block',
    fontSize: '14px',
  },
  publicKey: {
    padding: '2px 3px 1px 8px',
    borderBottom: '2px solid #ffed00',
    fontSize: '14px',
    color: 'gray',
    background: '#fffcaa',
  },
  numberSection: {
    borderRight: '1px solid gray',
    margin: '0 10px 0 0',
  },
  numberCount: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '380',
  },
  numberText: {
    display: 'block',
    fontSize: '12px',
    textDecoration: 'underline',
    color: 'blue',
  },
  numberTextUnClickable: {
    display: 'block',
    fontSize: '12px',
    color: 'gray',
  },
  userProfile: {},
  userProfileAvatar: {
    width: '100%',
    height: '100%',
    maxWidth: '80px',
    maxHeight: '80px',
    marginRight: '10px',
    borderRadius: '0',
  },
  userProfileName: {
    fontSize: '20px',
    fontWeight: '500',
  },
  userProfileBtnGroup: {
    marginTop: '20px',
  },
  simpleBtn: {
    border: '0px',
    background: 'white',
  },
};

const Input = styled.input`
  width: 100%;
`;
const Textarea = styled.textarea`
  width: 100%;
  height: 100px;
`;
const Div = styled.div`
  margin: 10px 0;
`;

interface FormData {
  name?: string;
  username?: string;
  about?: string;
  website?: string;
  bitcoinLightningAddress?: string;
  bitcoinLightningAddressLud16?: string;
  domainNameVerification?: string;
}

export const EditProfilePage = ({ isLoggedIn, myPrivateKey }) => {
  const { t } = useTranslation();
  const version = useVersion();
  const commitId = useCommitId();
  const myPublicKey = useReadonlyMyPublicKey();
  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );
  const [profile, setProfile] = useState<
    EventSetMetadataContent & { created_at: number }
  >();

  const { worker, newConn } = useCallWorker({
    onMsgHandler: (res: any, relayUrl?: string) => {
      const msg = JSON.parse(res);
      if (isEventSubResponse(msg)) {
        const event = (msg as EventSubResponse)[2];
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
    },
    updateWorkerMsgListenerDeps: [myPublicKey],
  });

  useEffect(() => {
    if (newConn.length === 0) return;
    if (myPublicKey == null) return;

    worker?.subMetadata([myPublicKey], undefined, undefined, {
      type: CallRelayType.batch,
      data: newConn,
    });
  }, [newConn, myPublicKey]);

  useEffect(() => {
    if (profile == null) return;

    setFormData(initialFormData);
    setAvatar(profile?.picture);
    setBanner(profile?.banner);
  }, [profile]);

  const initialFormData: FormData = {
    name: profile?.display_name,
    username: profile?.name,
    about: profile?.about,
    website: profile?.website,
    bitcoinLightningAddress: profile?.lud06,
    bitcoinLightningAddressLud16: profile?.lud16,
    domainNameVerification: profile?.nip05,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [avatar, setAvatar] = useState<string | undefined>(profile?.picture);
  const [banner, setBanner] = useState<string | undefined>(profile?.banner);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (signEvent == null) {
      return alert('no sign method!');
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
    if (worker == null) {
      return alert('something went wrong, please try again.');
    }

    worker?.pubEvent(event);

    alert('sent! please refresh the page, sorry will fix this soon');
  };

  return (
    <BaseLayout>
      <Left>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ textAlign: 'left' }}>
            <div
              style={{ fontSize: '24px', color: 'black', fontWeight: '500' }}
            >
              {t('profileEditPanel.title')}
            </div>
            <form onSubmit={handleSubmit}>
              <Div>
                <label htmlFor="name">
                  {t('profileEditPanel.displayName')}
                </label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </Div>
              <Div>
                <label htmlFor="username">
                  {t('profileEditPanel.username')}
                </label>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </Div>
              <Div>
                <label htmlFor="pictureUrl">
                  {t('profileEditPanel.avatar')}
                </label>
                <div>
                  <span style={{ marginRight: '10px' }}>
                    <ProfileAvatar picture={avatar} />
                  </span>
                  <ImageUploader
                    onImgUrls={(imgs: string[]) =>
                      setAvatar(imgs[imgs.length - 1])
                    }
                  />
                </div>
              </Div>
              <Div>
                <label htmlFor="about">{t('profileEditPanel.about')}</label>
                <Textarea
                  id="about"
                  name="about"
                  value={formData.about}
                  onChange={handleInputChange}
                />
              </Div>
              <Div>
                <label htmlFor="bannerUrl">
                  {t('profileEditPanel.banner')}
                </label>
                <ProfileBanner picture={banner} />
                <ImageUploader
                  onImgUrls={(imgs: string[]) =>
                    setBanner(imgs[imgs.length - 1])
                  }
                />
              </Div>
              <Div>
                <label htmlFor="website">{t('profileEditPanel.website')}</label>
                <Input
                  type="text"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                />
              </Div>
              <Div>
                <label htmlFor="bitcoinLightningAddress">
                  {t('profileEditPanel.btcLightningAddress')}
                </label>
                <Input
                  type="text"
                  id="bitcoinLightningAddress"
                  name="bitcoinLightningAddress"
                  value={formData.bitcoinLightningAddress}
                  onChange={handleInputChange}
                />
              </Div>
              <Div>
                <label htmlFor="bitcoinLightningAddress">
                  {t('profileEditPanel.lud16')}
                </label>
                <Input
                  type="text"
                  id="bitcoinLightningAddressLud16"
                  name="bitcoinLightningAddressLud16"
                  value={formData.bitcoinLightningAddressLud16}
                  onChange={handleInputChange}
                />
              </Div>
              <Div>
                <label htmlFor="domainNameVerification">
                  {t('profileEditPanel.domainNameVerification')}
                </label>
                <Input
                  type="text"
                  id="domainNameVerification"
                  name="domainNameVerification"
                  value={formData.domainNameVerification}
                  onChange={handleInputChange}
                />
              </Div>
              <Button fullWidth variant="contained" type="submit">
                {t('profileEditPanel.submit')}
              </Button>
            </form>
          </div>
        </div>

        <ThinHr></ThinHr>
        <div style={{ marginTop: '40px' }}>
          <div style={{ fontSize: '24px', color: 'black', fontWeight: '500' }}>
            {'About'}
          </div>
          <span>
            <p>
              {t('setting.version')} v{version}-{commitId}
            </p>
            Flycat is an open source project:{' '}
            <a
              href="https://github.com/digi-monkey/flycat-web"
              target="_blank"
              rel="noreferrer"
            >
              {t('nav.menu.github')}
            </a>
          </span>
        </div>
      </Left>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(EditProfilePage);
