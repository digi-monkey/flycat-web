import React from 'react';
import { maxStrings } from 'service/helper';
import { Article } from 'service/nip/23';

export interface BlogFeedItemProps {
  article: Article;
}
export function BlogFeedItem({ article: a }: BlogFeedItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        // alignItems: 'center',
        //  border: '1px solid #dbd5d5',
        padding: '10px 0px',
        margin: '5px 0px',
        cursor: 'pointer',
        borderBottom: '1px dashed rgb(221, 221, 221)',
      }}
      onClick={() => window.open('/post/' + a.pubKey + '/' + a.id, '__blank')}
    >
      {a.image && (
        <span
          style={{
            width: '100px',
            height: '100px',
            marginRight: '10px',
          }}
        >
          <img
            src={a.image}
            alt={a.title}
            style={{ maxWidth: '100px', maxHeight: '100%' }}
          />
        </span>
      )}
      <div style={{ overflow: 'scroll' }}>
        {a.title && (
          <span
            style={{
              fontSize: '16px',
              marginBottom: '5px',
              display: 'block',
              textTransform: 'capitalize',
            }}
          >
            {a.title}
          </span>
        )}
        {a.summary && (
          <p style={{ fontSize: '12px', color: 'gray' }}>
            {maxStrings(a.summary, 140)}
          </p>
        )}
      </div>
    </div>
  );
}
