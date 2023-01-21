import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SiteMetaDataContentSchema } from 'service/flycat-protocol';

export interface SiteMetaProps {
  isOwner: boolean;
  siteMetaData?: SiteMetaDataContentSchema;
  onSubmit?: (siteName, siteDescription) => any;
}

export function SiteMeta(props: SiteMetaProps) {
  const { t } = useTranslation();
  const { isOwner, siteMetaData, onSubmit } = props;

  return (
    <>
      {siteMetaData && (
        <>
          <h3>{siteMetaData.site_name}</h3>
          <span>{siteMetaData.site_description}</span>
        </>
      )}

      {!siteMetaData && !isOwner && <span>{t('siteMeta.noBlog')}</span>}

      {!siteMetaData && isOwner && <SiteCreateForm onSubmit={onSubmit} />}
    </>
  );
}

export interface SiteCreateFormProps {
  onSubmit?: (siteName, siteDescription) => any;
}

const SiteCreateForm: React.FC<SiteCreateFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(siteName, siteDescription);
    if (onSubmit) {
      onSubmit(siteName, siteDescription);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{t('siteMeta.createNewBlog')}</h3>
      <label>
        <input
          type="text"
          value={siteName}
          placeholder={t('siteMeta.namePlaceHolder')}
          onChange={e => setSiteName(e.target.value)}
        />
      </label>
      <br />
      <label>
        <input
          type="text"
          value={siteDescription}
          placeholder={t('siteMeta.aboutPlaceHolder')}
          onChange={e => setSiteDescription(e.target.value)}
        />
      </label>
      <br />
      <button type="submit">{t('siteMeta.submit')}</button>
    </form>
  );
};
