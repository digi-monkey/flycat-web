import { Grid } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { nip19Encode, Nip19DataType, PublicKey } from 'service/api';
import defaultAvatar from '../../../resource/logo512.png';

const styles = {
  userInfo: { marginBottom: '10px' },
  avatar: {
    width: '48px',
    height: '48px',
  },
  name: {
    marginLeft: '20px',
    fontSize: '20px',
    fontWeight: '500',
  },
  about: { display: 'block', fontSize: '14px', margin: '5px' },
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
  userProfile: {
    padding: '10px',
  },
  userProfileAvatar: {
    width: '80px',
    height: '80px',
    marginRight: '10px',
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
}

export const UserBox = ({
  pk,
  avatar,
  name,
  about,
  followCount,
}: UserBoxPros) => {
  const { t } = useTranslation();
  return (
    <>
      <div style={styles.userInfo}>
        <img style={styles.avatar} src={avatar} alt="user avatar" />
        <span style={styles.name}>{name}</span>
        <span style={styles.about}>{about}</span>
      </div>

      <div style={styles.publicKey}>
        {t('userBox.pubKey')}：{nip19Encode(pk, Nip19DataType.Pubkey)}
      </div>

      <Grid container style={{ marginTop: '20px' }}>
        <Grid item xs={3} style={styles.numberSection}>
          <span style={styles.numberCount}>
            {followCount ?? t('util.unknown')}
          </span>
          <span>
            <a style={styles.numberText} href={'/contact/' + pk}>
              {t('userBox.follow')}
            </a>
          </span>
        </Grid>
        <Grid item xs={3} style={styles.numberSection}>
          <span style={styles.numberCount}>{t('util.unknown')}</span>
          <span style={styles.numberTextUnClickable}>
            {t('userBox.followed')}
          </span>
        </Grid>
        <Grid item xs={3}>
          <span style={styles.numberCount}>{t('util.unknown')}</span>
          <span style={styles.numberTextUnClickable}>
            {t('userBox.noteMsg')}
          </span>
        </Grid>
      </Grid>
    </>
  );
};

export const UserRequiredLoginBox = () => {
  const { t } = useTranslation();
  return (
    <>
      <div style={styles.userInfo}>
        <img style={styles.avatar} src={defaultAvatar} alt="user avatar" />
        <span style={styles.name}>{t('UserRequiredLoginBox.loginFirst')}</span>
        <span style={styles.about}>{t('UserRequiredLoginBox.noAbout')}</span>
      </div>

      <div style={styles.publicKey}>t('UserRequiredLoginBox.noPubKey')</div>

      <Grid container style={{ marginTop: '20px' }}>
        <Grid item xs={3} style={styles.numberSection}>
          <span style={styles.numberCount}>{0}</span>
          <span>{t('userBox.follow')}</span>
        </Grid>
        <Grid item xs={3} style={styles.numberSection}>
          <span style={styles.numberCount}>未知</span>
          <span>{t('userBox.followed')}</span>
        </Grid>
        <Grid item xs={3}>
          <span style={styles.numberCount}>{t('util.unknown')}</span>
          <span>{t('userBox.noteMsg')}</span>
        </Grid>
      </Grid>
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
        <p>{t('UserProfileBox.hisAbout')}：</p>
        <span style={styles.about}>{about}</span>
      </div>

      <div style={styles.publicKey}>
        {t('UserProfileBox.hisPubKey')}：{nip19Encode(pk, Nip19DataType.Pubkey)}
      </div>

      <Grid container style={{ marginTop: '20px' }}>
        <Grid item xs={3} style={styles.numberSection}>
          <span style={styles.numberCount}>
            {followCount ?? t('util.unknown')}
          </span>
          <span>
            <a style={styles.numberText} href={'/contact/' + pk}>
              {t('UserProfileBox.hisFollow')}
            </a>
          </span>
        </Grid>
        <Grid item xs={3} style={styles.numberSection}>
          <span style={styles.numberCount}>{t('util.unknown')}</span>
          <span style={styles.numberTextUnClickable}>
            {t('UserProfileBox.hisFollower')}
          </span>
        </Grid>
        <Grid item xs={3}>
          <span style={styles.numberCount}>{t('util.unknown')}</span>
          <span style={styles.numberTextUnClickable}>
            {t('UserProfileBox.hisNoteMsg')}
          </span>
        </Grid>
      </Grid>
    </>
  );
};

export interface UserHeaderProps {
  pk: PublicKey;
  avatar?: string;
  name?: string;
  followOrUnfollowOnClick: () => any;
  followOrUnfollowText: string;
}
export const UserHeader = ({
  pk,
  avatar,
  name,
  followOrUnfollowOnClick,
  followOrUnfollowText,
}: UserHeaderProps) => {
  const { t } = useTranslation();
  return (
    <div style={styles.userProfile}>
      <Grid container style={{ background: '#F7F5EB' }}>
        <Grid item xs={2}>
          <img
            style={styles.userProfileAvatar ?? defaultAvatar}
            src={avatar}
            alt=""
          />
        </Grid>
        <Grid item xs={10}>
          <div style={styles.userProfileName}>{name}</div>
          <div style={styles.userProfileBtnGroup}>
            <button onClick={followOrUnfollowOnClick} style={styles.simpleBtn}>
              {followOrUnfollowText}
            </button>
            &nbsp;
            <button
              onClick={() => {
                window.open(`/blog/${pk}`, '_blank');
              }}
              style={styles.simpleBtn}
            >
              {t('UserHeader.hisBlog')}
            </button>
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
          <img
            style={styles.userProfileAvatar}
            src={avatar || defaultAvatar}
            alt=""
          />
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
            <a href={'/user/' + pk}>{name || t('UserBlogHeader.noUserName')}</a>
            {siteName
              ? t('UserBlogHeader.hisBlog')
              : t('UserBlogHeader.noBlog')}
          </div>
        </Grid>
      </Grid>
    </div>
  );
};
