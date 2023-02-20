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
      <video
        style={{ maxWidth: '100%', maxHeight: '300px' }}
        controls
        src={url}
      />
    </div>
  );
};
