import React, { useState } from 'react';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';

export const AudioPreview: React.FC<{ src: string }> = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div>
      <button onClick={() => setIsPlaying(!isPlaying)}>
        <VolumeUpOutlinedIcon /> {isPlaying ? 'Stop' : 'Play'}
      </button>
      {isPlaying && <audio src={src} controls />}
    </div>
  );
};
