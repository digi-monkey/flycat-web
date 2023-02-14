import { Grid } from '@mui/material';
import React from 'react';
import NavHeader, { MenuList, MenuListDefault } from './NavHeader';

const styles = {
  root: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    color: 'black',
    fontSize: '2em',
    fontWeight: '380',
    diplay: 'block',
    width: '100%',
    margin: '5px',
  },
  ul: {
    padding: '10px',
    background: 'white',
    borderRadius: '5px',
  },
  li: {
    display: 'inline',
    padding: '10px',
  },
  content: {
    //margin: '5px 0px',
    minHeight: '700px',
    //background: 'white',
    borderRadius: '5px',
    width: '100%',
  },
  left: {
    width: '100%',
    height: '100%',
    minHeight: '700px',
    padding: '3%',
    background: 'white',
  },
  right: {
    minHeight: '700px',
    padding: '3%',
    background: 'white',
    margin: '0px 0px 0px 20px',
    borderRadius: '5px',
    //  position: "fixed" as const
  },
  postBox: {},
  postHintText: {
    color: '#acdae5',
    marginBottom: '5px',
  },
  postTextArea: {
    resize: 'none' as const,
    boxShadow: 'inset 0 0 1px #aaa',
    border: '1px solid #b9bcbe',
    width: '100%',
    height: '80px',
    fontSize: '14px',
    padding: '5px',
    overflow: 'auto',
  },
  btn: {
    display: 'box',
    textAlign: 'right' as const,
  },
  message: {
    marginTop: '5px',
  },
  msgsUl: {
    padding: '5px',
  },
  msgItem: {
    display: 'block',
    borderBottom: '1px dashed #ddd',
    padding: '15px 0',
  },
  avatar: {
    display: 'block',
    width: '60px',
    height: '60px',
  },
  msgWord: {
    fontSize: '14px',
    display: 'block',
  },
  userName: {
    textDecoration: 'underline',
    marginRight: '5px',
  },
  time: {
    color: 'gray',
    fontSize: '12px',
    marginTop: '5px',
  },
  smallBtn: {
    fontSize: '12px',
    marginLeft: '5px',
    border: 'none' as const,
  },
  connected: {
    fontSize: '18px',
    fontWeight: '500',
    color: 'green',
  },
  disconnected: {
    fontSize: '18px',
    fontWeight: '500',
    color: 'red',
  },
  userProfileAvatar: {
    width: '60px',
    height: '60px',
  },
  userProfileName: {
    fontSize: '20px',
    fontWeight: '500',
  },
};

export interface BaseLayoutProps {
  children: React.ReactNode;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  const left: React.ReactNode[] = [];
  const right: React.ReactNode[] = [];
  React.Children.forEach(children, (child: React.ReactNode) => {
    if (React.isValidElement(child) && child.type === Left) {
      left.push(child);
    }
    if (React.isValidElement(child) && child.type === Right) {
      right.push(child);
    }
  });
  return (
    <div style={styles.root}>
      <Grid container style={{ zIndex: '1' }}>
        <Grid
          item
          xs={12}
          sm={2}
          style={
            {
              //borderRight: "1px solid #e0e0e0"
            }
          }
        >
          <div
            style={{
              width: '100%',
              padding: '0px 20px 0px 0px',
              position: 'sticky',
              top: '10px',
              zIndex: '1',
            }}
          >
            <MenuListDefault />
          </div>
        </Grid>
        <Grid item xs={12} sm={6}>
          <div
            style={{
              position: 'sticky' as const,
              top: '0px',
              background: 'white',
              //   background: '#e0e0e0',
              padding: '10px 3%',
              //marginTop: '20px',
              //marginBottom: '20px',
              //  borderBottom: "1px solid #e0e0e0"
            }}
          >
            <NavHeader />
          </div>
          <div style={styles.left}>{left}</div>
        </Grid>
        <Grid item xs={12} sm={4} style={{ zIndex: '0' }}>
          <div
            style={{
              // paddingTop: '10px',
              paddingLeft: '60px',
              //position: 'sticky' as const,
              //top: '0',
              zIndex: '1',
              maxWidth: '100%',
              width: '400px',
            }}
          >
            {right}
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export interface LeftProps {
  children: React.ReactNode;
}
export const Left: React.FC<LeftProps> = ({ children }) => (
  <div>{children}</div>
);

export interface RightProps {
  children: React.ReactNode;
}
export const Right: React.FC<RightProps> = ({ children }) => (
  <div>{children}</div>
);
