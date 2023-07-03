import React from 'react';

export function TagItem({ tag }: { tag: string }) {
  return (
    <div
      style={{
        margin: '5px',
        padding: '5px',
        borderRadius: '5px',
        color: 'gray',
        display: 'inline-block',
      }}
    >
      #{tag}
    </div>
  );
}
