import React, { useState, useEffect } from 'react';
import { getUrlMetadata, UrlMetadata } from 'service/ogp';

interface PreviewProps {
  url: string;
}

// todo: this is often blocked by CORS
export function UrlPreview({ url }: PreviewProps) {
  const [data, setData] = useState<UrlMetadata>();

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getUrlMetadata(url);
        setData(result);
      } catch (error) {
        console.error(error);
      }
    }

    fetchData();
  }, [url]);

  if (!data) {
    return <div style={{ textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div
      style={{
        display: 'flex',
        // alignItems: 'center',
        border: '1px solid #dbd5d5',
        padding: '10px',
        margin: '5px 0px',
      }}
    >
      {data.image && (
        <span style={{ width: '100px', height: '100px', marginRight: '10px' }}>
          <img src={data.image} alt={data.title} style={{ width: '100px' }} />
        </span>
      )}
      <div>
        {data.title && (
          <span
            style={{ fontSize: '16px', marginBottom: '5px', display: 'block' }}
          >
            {data.title}
          </span>
        )}
        <a href={data.url || url}>{data.url || url}</a>
        {data.description && (
          <p style={{ fontSize: '12px', color: 'gray' }}>{data.description}</p>
        )}
      </div>
    </div>
  );
}
