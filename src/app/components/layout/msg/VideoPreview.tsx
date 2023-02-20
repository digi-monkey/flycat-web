import React, { useState } from 'react';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';

export interface VideoPreviewProps {
  url: string;
  autoPreview?: boolean;
}

export const VideoPreview = ({ url, autoPreview }: VideoPreviewProps) => {
  const [showPreview, setShowPreview] = useState(
    autoPreview === undefined ? false : autoPreview,
  );

  return (
    <div>
      <video style={{ minWidth: '300px', width: '100%' }} controls src={url} />
    </div>
  );
};
