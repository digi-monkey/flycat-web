import React from 'react';

export const AudioPreview: React.FC<{ src: string }> = ({ src }) => {
  return <div>{<audio src={src} controls />}</div>;
};
