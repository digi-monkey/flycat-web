import React, { useState, useEffect } from 'react';
import { generatePreview, PreviewData } from '../../../service/url-preview';

interface PreviewProps {
  url: string;
}

// todo: this is often blocked by CORS
export function UrlPreview({ url }: PreviewProps) {
  const [data, setData] = useState<PreviewData>();

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await generatePreview(url);
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
        alignItems: 'center',
        border: '1px solid gray',
      }}
    >
      {data.image && (
        <img
          src={data.image}
          alt={data.title}
          style={{ maxWidth: '200px', maxHeight: '200px', marginRight: '20px' }}
        />
      )}
      <div>
        {data.title && (
          <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>
            {data.title}
          </h1>
        )}
        {data.description && (
          <p style={{ fontSize: '16px', lineHeight: '1.5', color: '#333' }}>
            {data.description}
          </p>
        )}
      </div>
    </div>
  );
}
