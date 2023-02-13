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
      {showPreview ? (
        <div>
          <video style={{ width: '100%' }} controls src={url} />
        </div>
      ) : (
        <div>
          <PlayCircleOutlinedIcon />
          <button
            style={{ background: 'none', border: 'none' }}
            onClick={() => setShowPreview(true)}
          >
            play video
          </button>
        </div>
      )}
    </div>
  );
};
