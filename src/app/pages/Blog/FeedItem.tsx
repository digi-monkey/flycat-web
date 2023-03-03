import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useTimeSince } from 'hooks/useTimeSince';
import React from 'react';
import { maxStrings } from 'service/helper';
import { Article } from 'service/nip/23';
import { TagItem } from './hashTags/TagItem';
import { Reactions } from './Reactions';

export interface BlogFeedItemProps {
  article: Article;
  lightingAddress?: string;
}
export function PersonalBlogFeedItem({
  article,
  lightingAddress,
}: BlogFeedItemProps) {
  const myPublicKey = useReadonlyMyPublicKey();
  return (
    <div
      style={{
        borderBottom: '1px dashed rgb(221, 221, 221)',
        margin: '5px 0px',
        padding: '10px 0px',
      }}
    >
      <div
        style={{
          display: 'flex',
          cursor: 'pointer',
        }}
        onClick={() =>
          window.open('/post/' + article.pubKey + '/' + article.id, '__blank')
        }
      >
        {article.image && (
          <span
            style={{
              width: '100px',
              height: '100px',
              marginRight: '10px',
            }}
          >
            <img
              src={article.image}
              alt={article.title}
              style={{ maxWidth: '100px', maxHeight: '100%' }}
            />
          </span>
        )}
        <div style={{ overflow: 'scroll' }}>
          {article.title && (
            <span
              style={{
                fontSize: '16px',
                marginBottom: '5px',
                display: 'block',
                textTransform: 'capitalize',
              }}
            >
              {article.title}
            </span>
          )}
          {article.summary && (
            <p style={{ fontSize: '12px', color: 'gray' }}>
              {maxStrings(article.summary, 140)}
            </p>
          )}
        </div>
      </div>
      <div style={{ color: 'gray', fontSize: '12px', marginTop: '5px' }}>
        <span>
          {article.hashTags?.slice(0, 5).map(a => (
            <TagItem tag={a} />
          ))}
          <Reactions
            article={article}
            pk={myPublicKey}
            lightingAddress={lightingAddress}
          />
        </span>
      </div>
    </div>
  );
}

export function BlogFeedItem({ article, lightingAddress }: BlogFeedItemProps) {
  const myPublicKey = useReadonlyMyPublicKey();
  return (
    <>
      <div
        style={{
          display: 'flex',
          border: '1px solid #dbd5d5',
          padding: '20px 10px',
          margin: '5px 0px',
          cursor: 'pointer',
          borderRadius: '5px',
        }}
        onClick={() =>
          window.open('/post/' + article.pubKey + '/' + article.id, '__blank')
        }
      >
        {article.image && (
          <span
            style={{
              width: '100px',
              height: '100px',
              marginRight: '10px',
            }}
          >
            <img
              src={article.image}
              alt={article.title}
              style={{ maxWidth: '100px', maxHeight: '100%' }}
            />
          </span>
        )}
        <div style={{ overflow: 'scroll' }}>
          {article.title && (
            <span
              style={{
                fontSize: '16px',
                marginBottom: '5px',
                display: 'block',
                textTransform: 'capitalize',
              }}
            >
              {article.title}
            </span>
          )}
          {article.summary && (
            <p style={{ fontSize: '12px', color: 'gray' }}>
              {maxStrings(article.summary, 140)}
            </p>
          )}
        </div>
      </div>
      <div style={{ color: 'gray', fontSize: '12px', marginTop: '5px' }}>
        {article.hashTags?.slice(0, 5).map(a => (
          <TagItem tag={a} />
        ))}
        <Reactions
          article={article}
          pk={myPublicKey}
          lightingAddress={lightingAddress}
        />
      </div>
    </>
  );
}
