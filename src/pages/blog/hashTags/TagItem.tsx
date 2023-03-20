import React from 'react';
import { useTheme } from '@mui/material';

export function TagItem({ tag }: { tag: string }) {
  const theme = useTheme();
  return (
    <div
      style={{
        background: theme.palette.secondary.main,
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
