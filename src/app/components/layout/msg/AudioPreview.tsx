import React, { useState } from 'react';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';

export const AudioPreview: React.FC<{ src: string }> = ({ src }) => {
  return <div>{<audio src={src} controls />}</div>;
};
