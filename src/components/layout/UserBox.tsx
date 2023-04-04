import { Grid } from '@mui/material';
import { Paths } from 'constants/path';
import { CopyText } from './util/CopyText';
import { useRouter } from 'next/router';
import { RootState } from 'store/configureStore';
import { CallWorker } from 'service/worker/callWorker';
import { useSelector } from 'react-redux';
import { LoginFormTip } from './NavHeader';
import { ImageUploader } from './PubNoteTextarea';
import { useTranslation } from 'next-i18next';
import { WsConnectStatus } from 'service/worker/type';
import { payLnUrlInWebLn } from 'service/lighting/lighting';
import { useEffect, useState } from 'react';
import { ProfileAvatar, ProfileBanner } from './msg/TextMsg';
import {
  nip19Encode,
  Nip19DataType,
  PublicKey,
  EventSetMetadataContent,
  Nostr,
} from 'service/api';

import Link from 'next/link';
import styled from 'styled-components';
import RelayManager from '../../pages/relay/index.page';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import ElectricBoltOutlinedIcon from '@mui/icons-material/ElectricBoltOutlined';
import PermContactCalendarIcon from '@mui/icons-material/PermContactCalendar';

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

export interface UserBoxPros {
  pk: string;
  avatar?: string;
  name?: string;
  about?: string;
  followCount?: number;
  relayConnectedCount?: number;
}

export const UserBox = ({ pk, avatar, relayConnectedCount }: UserBoxPros) => {
  const { t } = useTranslation();
  const size = '30px';
  const [wsConnectStatus, setWsConnectStatus] = useState<WsConnectStatus>(
    new Map(),
  );

  return (
    <>
      <div style={styles.userInfo}>
        {/* todo: move to public comp */}
        <Link href={Paths.relay}>
          <span style={{ marginRight: '30px', color: '#8DC535' }}>
            <ElectricalServicesIcon />
            <span>
              {relayConnectedCount ||
                Array.from(wsConnectStatus).filter(s => s[1] === true).length}
            </span>
            <span hidden>
              <RelayManager wsStatusCallback={setWsConnectStatus} />
            </span>
          </span>
        </Link>

        <ProfileAvatar
          style={{ width: size, height: size }}
          picture={avatar}
          name={pk}
        />
        {/*
          <span style={styles.name}>{name}</span>
          <span style={styles.about}>
          <CopyText
            name={'🔑'}
            textToCopy={nip19Encode(pk, Nip19DataType.Pubkey)}
            successMsg={'PublicKey copied to clipboard!'}
          />
          {about}
        </span>
        */}
      </div>

      {/*
      <Grid container style={{ marginTop: '20px' }}>
        <Grid item xs={3} style={styles.numberSection}>
          <span style={styles.numberCount}>
            {followCount ?? t('util.noNumberData')}
          </span>
          <span>
            <a style={styles.numberText} href={'/contact/' + pk}>
              {t('userBox.follow')}
            </a>
          </span>
        </Grid>
        <Grid item xs={3} style={styles.numberSection}>
          <span style={styles.numberCount}>{t('util.noNumberData')}</span>
          <span style={styles.numberTextUnClickable}>
            {t('userBox.followed')}
          </span>
        </Grid>
        <Grid item xs={3}>
          <span style={styles.numberCount}>{t('util.noNumberData')}</span>
          <span style={styles.numberTextUnClickable}>
            {t('userBox.noteMsg')}
          </span>
        </Grid>
      </Grid>
      */}
    </>
  );
};

export const UserRequiredLoginBox = () => {
  const { t } = useTranslation();
  return (
    <>
      <div style={styles.userInfo}>
        <ProfileAvatar style={{ width: '30px', height: '30px' }} />
        <div>
          <LoginFormTip
            style={{ fontSize: '12px', background: 'none', padding: '0' }}
            text={t('UserRequiredLoginBox.loginFirst') || ''}
          />
        </div>
      </div>
    </>
  );
};

export interface UserProfileBoxProps {
  pk: PublicKey;
  about?: string;
  followCount?: number;
}
export const UserProfileBox = ({ pk, about, followCount }: UserBoxPros) => {
  const { t } = useTranslation();
  return (
    <>
      <div style={styles.userInfo}>
        <span style={styles.about}>
          <CopyText
            name={'🔑'}
            textToCopy={nip19Encode(pk, Nip19DataType.Pubkey)}
            successMsg={'PublicKey copied to clipboard!'}
          />
          {about}
        </span>
      </div>

      <Grid container style={{ marginTop: '20px' }}>
        <Grid item xs={3} style={styles.numberSection}>
          <span style={styles.numberCount}>
            {followCount ?? t('util.noNumberData')}
          </span>
          <span>
            <Link style={styles.numberText} href={`${Paths.contact + pk}`}>
              {t('userBox.follow')}
            </Link>
          </span>
        </Grid>
        <Grid item xs={3} style={styles.numberSection}>
          <span style={styles.numberCount}>{t('util.noNumberData')}</span>
          <span style={styles.numberTextUnClickable}>
            {t('userBox.followed')}
          </span>
        </Grid>
        <Grid item xs={3}>
          <span style={styles.numberCount}>{t('util.noNumberData')}</span>
          <span style={styles.numberTextUnClickable}>
            {t('userBox.noteMsg')}
          </span>
        </Grid>
      </Grid>
    </>
  );
};

export interface UserHeaderProps {
  pk: string;
  metadata?: EventSetMetadataContent;
  followOrUnfollowOnClick: () => any;
  isFollowed: boolean;
}
export const UserHeader = ({
  pk,
  metadata,
  followOrUnfollowOnClick,
  isFollowed,
}: UserHeaderProps) => {
  const router = useRouter();
  return (
    <div style={styles.userProfile}>
      <Grid container spacing={1} style={{ background: '#F7F5EB' }}>
        <Grid item xs={2}>
          <ProfileAvatar
            style={styles.userProfileAvatar}
            picture={metadata?.picture || ''}
          />
        </Grid>
        <Grid item xs={10}>
          <div style={styles.userProfileName}>
            {metadata?.name}
            <span
              onClick={followOrUnfollowOnClick}
              style={{
                cursor: 'pointer',
                marginLeft: '20px',
              }}
            >
              {!isFollowed ? (
                <PersonAddIcon style={{ color: 'gray' }} />
              ) : (
                <PersonRemoveIcon style={{ color: 'gray' }} />
              )}
            </span>
            {(metadata?.lud06 || metadata?.lud16) && (
              <span
                onClick={() => {
                  const url = metadata?.lud06 || metadata?.lud16;
                  payLnUrlInWebLn(url);
                }}
                style={{
                  cursor: 'pointer',
                  marginLeft: '10px',
                }}
              >
                <ElectricBoltOutlinedIcon
                  style={{ color: 'gray', lineHeight: '12px' }}
                />
              </span>
            )}

            <span
              onClick={() => router.push({ pathname: Paths.contact + pk})}
              style={{
                cursor: 'pointer',
                marginLeft: '10px',
              }}
            >
              <PermContactCalendarIcon
                style={{ color: 'gray', lineHeight: '12px' }}
              />
            </span>
          </div>
          <div
            style={{
              color: 'gray',
              fontSize: '12px',
              marginTop: '10px',
            }}
          >
            {metadata?.about}
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export interface UserBlogHeaderProps {
  pk: PublicKey;
  avatar?: string;
  name?: string;
  siteName?: string;
  siteDescription?: string;
}
export const UserBlogHeader = ({
  pk,
  avatar,
  name,
  siteName,
  siteDescription,
}: UserBlogHeaderProps) => {
  const { t } = useTranslation();
  return (
    <div style={styles.userProfile}>
      <Grid container style={{ background: '#F7F5EB' }}>
        <Grid item xs={2}>
          <ProfileAvatar picture={avatar} style={styles.userProfileAvatar} />
        </Grid>
        <Grid item xs={10}>
          <div style={styles.userProfileName}>
            {siteName || t('util.unknown')}
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'gray',
              marginTop: '5px',
            }}
          >
            {siteDescription}
          </div>
          <div
            style={{
              fontSize: '14px',
              marginTop: '6px',
            }}
          >
            <Link href={`${Paths.user + pk}`}>{name || t('UserBlogHeader.noUserName')}</Link>
            {siteName
              ? t('UserBlogHeader.hisBlog')
              : t('UserBlogHeader.noBlog')}
          </div>
        </Grid>
      </Grid>
    </div>
  );
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

export const ProfileEditPanel = ({
  profile,
  worker,
}: {
  profile?: EventSetMetadataContent;
  worker?: CallWorker;
}) => {
  const { t } = useTranslation();
  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );
  interface FormData {
    name?: string;
    username?: string;
    about?: string;
    website?: string;
    bitcoinLightningAddress?: string;
    bitcoinLightningAddressLud16?: string;
    domainNameVerification?: string;
  }

  const initialFormData: FormData = {
    name: profile?.display_name,
    username: profile?.name,
    about: profile?.about,
    website: profile?.website,
    bitcoinLightningAddress: profile?.lud06,
    bitcoinLightningAddressLud16: profile?.lud16,
    domainNameVerification: profile?.nip05,
  };
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState(initialFormData);
  const [avatar, setAvatar] = useState<string | undefined>(profile?.picture);
  const [banner, setBanner] = useState<string | undefined>(profile?.banner);

  useEffect(() => {
    if (profile == null) return;

    setFormData(initialFormData);
    setAvatar(profile?.picture);
    setBanner(profile?.banner);
  }, [profile]);

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
    
    const rawEvent = await Nostr.newProfileRawEvent(data);
    const event = await signEvent(rawEvent);
    if (worker == null) {
      return alert('something went wrong, please try again.');
    }

    worker?.pubEvent(event);

    setIsOpen(false);

    alert('sent! please refresh the page, sorry will fix this soon');
  };

  return (
    <span>
      <span style={{ cursor: 'pointer' }} onClick={() => setIsOpen(true)}>
        <BorderColorIcon style={{ fontSize: '18px' }} />
      </span>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '20px',
            zIndex: 999,
            width: '500px',
            maxWidth: '100%',
            height: 'auto',
            maxHeight: '80%',
            overflowY: 'scroll',
            boxShadow: '0px 0px 10px #ccc',
            borderRadius: '5px',
            textAlign: 'center',
          }}
        >
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
              <Div
                style={{
                  width: '100%',
                  margin: '10px 0',
                  textAlign: 'center' as const,
                }}
              >
                <button type="submit">{t('profileEditPanel.submit')}</button>{' '}
                <button type="button" onClick={() => setIsOpen(false)}>
                  {t('profileEditPanel.cancel')}
                </button>
              </Div>
            </form>
          </div>
        </div>
      )}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 998,
          background: 'black',
          opacity: 0.5,
          filter: 'blur(5px)',
          display: isOpen ? 'block' : 'none',
        }}
      ></div>
    </span>
  );
};
