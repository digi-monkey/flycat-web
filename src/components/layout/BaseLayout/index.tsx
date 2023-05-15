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
import UserMenu from '../../UserMenu';
import { NavHeader, MenuListDefault } from '../NavHeader';
import { UserRequiredLoginBox } from '../UserBox';
import Drawer from '@mui/material/Drawer';
import DehazeIcon from '@mui/icons-material/Dehaze';

import styles from './index.module.scss';
import Container from 'components/Container';
import { useMatchMobile } from 'hooks/useMediaQuery';

// const styles = {
//   root: {
//     width: '100%',
//     maxWidth: '1200px',
//     margin: '0 auto',
//   },
//   title: {
//     color: 'black',
//     fontSize: '2em',
//     fontWeight: '380',
//     diplay: 'block',
//     width: '100%',
//     margin: '5px',
//   },
//   ul: {
//     padding: '10px',
//     background: 'white',
//     borderRadius: '5px',
//   },
//   li: {
//     display: 'inline',
//     padding: '10px',
//   },
//   content: {
//     //margin: '5px 0px',
//     minHeight: '700px',
//     //background: 'white',
//     borderRadius: '5px',
//     width: '100%',
//   },
//   left: {
//     width: '100%',
//     height: '100%',
//     minHeight: '700px',
//     padding: '3%',
//     background: 'white',
//   },
//   right: {
//     minHeight: '700px',
//     padding: '3%',
//     background: 'white',
//     margin: '0px 0px 0px 20px',
//     borderRadius: '5px',
//     //  position: "fixed" as const
//   },
//   postBox: {},
//   postHintText: {
//     color: '#acdae5',
//     marginBottom: '5px',
//   },
//   postTextArea: {
//     resize: 'none' as const,
//     boxShadow: 'inset 0 0 1px #aaa',
//     border: '1px solid #b9bcbe',
//     width: '100%',
//     height: '80px',
//     fontSize: '14px',
//     padding: '5px',
//     overflow: 'auto',
//   },
//   btn: {
//     display: 'box',
//     textAlign: 'right' as const,
//   },
//   message: {
//     marginTop: '5px',
//   },
//   msgsUl: {
//     padding: '5px',
//   },
//   msgItem: {
//     display: 'block',
//     borderBottom: '1px dashed #ddd',
//     padding: '15px 0',
//   },
//   avatar: {
//     display: 'block',
//     width: '60px',
//     height: '60px',
//   },
//   msgWord: {
//     fontSize: '14px',
//     display: 'block',
//   },
//   userName: {
//     textDecoration: 'underline',
//     marginRight: '5px',
//   },
//   time: {
//     color: 'gray',
//     fontSize: '12px',
//     marginTop: '5px',
//   },
//   smallBtn: {
//     fontSize: '12px',
//     marginLeft: '5px',
//     border: 'none' as const,
//   },
//   connected: {
//     fontSize: '18px',
//     fontWeight: '500',
//     color: 'green',
//   },
//   disconnected: {
//     fontSize: '18px',
//     fontWeight: '500',
//     color: 'red',
//   },
//   userProfileAvatar: {
//     width: '60px',
//     height: '60px',
//   },
//   userProfileName: {
//     fontSize: '20px',
//     fontWeight: '500',
//   },
// };

export interface BaseLayoutProps {
  children: React.ReactNode;
  silent?: boolean;
  metaPage?: {
    title?: string;
    link?: string;
  };
}

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

export const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  silent,
  metaPage,
}) => {
  // const theme = useTheme();
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

  const leftNodes: React.ReactNode[] = [];
  const rightNodes: React.ReactNode[] = [];
  React.Children.forEach(children, (child: React.ReactNode) => {
    if (React.isValidElement(child) && child.type === Left) {
      leftNodes.push(child);
    }
    if (React.isValidElement(child) && child.type === Right) {
      rightNodes.push(child);
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
  const isMobile = useMatchMobile();

  return <Container>
    {
      isMobile ? <div>
        <header>
          header
        </header>
        {rightNodes}
        <footer>
          footer
        </footer>
      </div> : <>
        <MenuListDefault />
        {rightNodes}
      </>
    }
  </Container>;
};
