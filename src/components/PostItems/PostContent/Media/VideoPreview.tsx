import React, { useState } from 'react';

export interface VideoPreviewProps {
  url: string;
  autoPreview?: boolean;
}

export const VideoPreview = ({ url, autoPreview }: VideoPreviewProps) => {
  return (
    <video
      onClick={e => e.stopPropagation()}
      style={{ maxWidth: '100%', maxHeight: '300px' }}
      controls
      src={url}
    />
  );
};
