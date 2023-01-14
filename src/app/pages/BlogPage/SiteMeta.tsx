import React, { useState } from 'react';
import { SiteMetaDataContentSchema } from 'service/flycat-protocol';

export interface SiteMetaProps {
  isOwner: boolean;
  siteMetaData?: SiteMetaDataContentSchema;
  onSubmit?: (siteName, siteDescription) => any;
}

export function SiteMeta(props: SiteMetaProps) {
  const { isOwner, siteMetaData, onSubmit } = props;

  return (
    <>
      {siteMetaData && (
        <>
          <h3>{siteMetaData.site_name}</h3>
          <span>{siteMetaData.site_description}</span>
        </>
      )}

      {!siteMetaData && !isOwner && <span>这个用户还没有公众号</span>}

      {!siteMetaData && isOwner && <SiteCreateForm onSubmit={onSubmit} />}
    </>
  );
}

export interface SiteCreateFormProps {
  onSubmit?: (siteName, siteDescription) => any;
}

const SiteCreateForm: React.FC<SiteCreateFormProps> = ({ onSubmit }) => {
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
      <h3>创建一个新公众号</h3>
      <label>
        <input
          type="text"
          value={siteName}
          placeholder="公众号名称"
          onChange={e => setSiteName(e.target.value)}
        />
      </label>
      <br />
      <label>
        <input
          type="text"
          value={siteDescription}
          placeholder="公众号介绍描述"
          onChange={e => setSiteDescription(e.target.value)}
        />
      </label>
      <br />
      <button type="submit">创建</button>
    </form>
  );
};
