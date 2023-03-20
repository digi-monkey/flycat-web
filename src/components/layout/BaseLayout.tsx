import { Box, Grid, Hidden, Toolbar, useTheme } from '@mui/material';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Event,
  WellKnownEventKind,
  EventSetMetadataContent,
  deserializeMetadata,
} from 'service/api';
import { isEmptyStr } from 'service/helper';
import { UserMap } from 'service/type';
import { CallRelayType } from 'service/worker/type';
import { RootState } from 'store/configureStore';
import UserMenu from '../Navbar/UserMenu';
import { NavHeader, MenuListDefault } from './NavHeader';
import { UserRequiredLoginBox } from './UserBox';
import Drawer from '@mui/material/Drawer';
import DehazeIcon from '@mui/icons-material/Dehaze';

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
  silent?: boolean;
  metaPage?: {
    title?: string;
    link?: string;
  };
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  silent,
  metaPage,
}) => {
  const theme = useTheme();
  const isLoggedIn = useSelector(
    (state: RootState) => state.loginReducer.isLoggedIn,
  );
  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn } = useCallWorker();
  const [userMap, setUserMap] = useState<UserMap>(new Map());

  function handleEvent(event: Event, relayUrl?: string) {
    switch (event.kind) {
      case WellKnownEventKind.set_metadata:
        const metadata: EventSetMetadataContent = deserializeMetadata(
          event.content,
        );
        setUserMap(prev => {
          const newMap = new Map(prev);
          const oldData = newMap.get(event.pubkey);
          if (oldData && oldData.created_at > event.created_at) {
            // the new data is outdated
            return newMap;
          }

          newMap.set(event.pubkey, {
            ...metadata,
            ...{ created_at: event.created_at },
          });
          return newMap;
        });
        break;

      default:
        break;
    }
  }

  useEffect(() => {
    if (newConn.length === 0) return;

    if (!isEmptyStr(myPublicKey) && userMap.get(myPublicKey) == null) {
      worker
        ?.subMetadata([myPublicKey], undefined, undefined, {
          type: CallRelayType.batch,
          data: newConn,
        })
        ?.iterating({ cb: handleEvent });
    }
  }, [newConn]);

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

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const drawerRef = useRef<any>(null);
  const handleClose = event => {
    if (drawerRef.current && drawerRef.current.contains(event.target)) {
      // Click inside drawer, don't close
      return;
    }
    setIsDrawerOpen(false);
  };

  return (
    <div style={styles.root}>
      <Grid container style={{ zIndex: '1' }}>
        <Grid item xs={12} sm={2}>
          <Hidden mdUp>
            <DehazeIcon
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              style={{ cursor: 'pointer', position: 'fixed' }}
            />
            <Drawer
              anchor="left"
              variant="temporary"
              open={isDrawerOpen}
              onClose={handleClose}
            >
              <Box sx={{ width: 250 }}>
                <DehazeIcon
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  style={{ cursor: 'pointer', float: 'right' }}
                />
                <MenuListDefault />
              </Box>
            </Drawer>
          </Hidden>
          <Hidden smDown>
            <div
              style={{
                width: '100%',
                padding: '0px 20px 0px 0px',
                position: 'sticky',
                top: '10px',
                zIndex: '3',
                display: silent != null && silent === true ? 'none' : 'block',
              }}
            >
              <Box sx={{ width: 250 }} ref={drawerRef}>
                <MenuListDefault />
              </Box>
            </div>
          </Hidden>
        </Grid>

        <Grid item xs={12} sm={10}>
          <Grid container>
            <Grid
              item
              xs={12}
              sm={8}
              style={{ paddingLeft: '20px', paddingRight: '20px' }}
            >
              <Hidden smDown>
                <div
                  style={{
                    position: 'sticky' as const,
                    top: '0px',
                    background: 'white',
                    padding: '10px 3%',
                    zIndex: '2',
                  }}
                >
                  <NavHeader title={metaPage?.title} link={metaPage?.link} />
                </div>
              </Hidden>

              <div style={styles.left}>{left}</div>
            </Grid>
            <Grid
              item
              xs={12}
              sm={4}
              style={{
                paddingLeft: '30px',
                zIndex: '1',
                width: '400px',
              }}
            >
              <Hidden smDown>
                <div
                  style={{
                    position: 'sticky' as const,
                    top: '0px',
                    background: 'white',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    zIndex: '2',
                  }}
                >
                  {isLoggedIn && (
                    <UserMenu
                      pk={myPublicKey}
                      userInfo={userMap.get(myPublicKey)}
                    />
                  )}
                  {!isLoggedIn && <UserRequiredLoginBox />}
                </div>
              </Hidden>

              <div>{right}</div>

              <Hidden mdUp>
                <div
                  style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    background: 'white',
                    zIndex: 10,
                    borderTop: '1px solid ' + theme.palette.secondary.main,
                  }}
                >
                  <Toolbar
                    style={{
                      display: 'flex',
                      justifyContent: 'space-around',
                    }}
                  >
                    {isLoggedIn && (
                      <UserMenu
                        pk={myPublicKey}
                        userInfo={userMap.get(myPublicKey)}
                      />
                    )}
                    {!isLoggedIn && <UserRequiredLoginBox />}
                  </Toolbar>
                </div>
              </Hidden>
            </Grid>
          </Grid>
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
  children?: React.ReactNode;
}
export const Right: React.FC<RightProps> = ({ children }) => (
  <div>{children}</div>
);
