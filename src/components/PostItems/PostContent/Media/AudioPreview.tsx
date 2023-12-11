import React from 'react';

export const AudioPreview: React.FC<{ src: string }> = ({ src }) => {
  return <div onClick={(e)=>e.stopPropagation()}>{<audio src={src} controls />}</div>;
};
