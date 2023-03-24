import React from 'react';
import { useTheme } from '@mui/material';
import styled from 'styled-components';

interface BookProps {
  title: string;
  count: number;
  time?: number;
}

export const Book: React.FC<BookProps> = ({ title, count, time }) => {
  const theme = useTheme();

  const Div = styled.div`
    display: inline-block;
    margin: 10px 0px;
    width: 150px;
    height: 200px;
    cursor: pointer;
    border: 1px solid ${theme.palette.secondary.main};
    :hover {
      border: 1px solid ${theme.palette.primary.main};
    }
  `;

  return (
    <Div
      onClick={() => {
        alert('wait for me, working on it');
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div style={{ position: 'absolute', top: '20%', left: 0, right: 0 }}>
          <div
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 'bold',
              textAlign: 'center',
              textTransform: 'capitalize',
            }}
          >
            {title}
          </div>
          <div
            style={{
              margin: '4px 0 0',
              fontSize: '14px',
              textAlign: 'center',
              color: 'gray',
            }}
          >
            {'('}
            {count}
            {')'}
          </div>

          <div
            style={{
              margin: '80px 0 0',
              fontSize: '10px',
              textAlign: 'center',
              color: 'gray',
            }}
          >
            {time
              ? new Date(time * 1000).toLocaleDateString()
              : 'some times ago'}
          </div>
        </div>
      </div>
    </Div>
  );
};
