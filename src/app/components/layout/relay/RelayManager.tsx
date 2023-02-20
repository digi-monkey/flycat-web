import { Grid } from '@mui/material';
import { loginMapStateToProps } from 'app/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { RelayUrl } from 'service/api';
import { equalMaps } from 'service/helper';
import { defaultRelays } from 'service/relay';
import { CallWorker } from 'service/worker/callWorker';
import { FromWorkerMessageData, WsConnectStatus } from 'service/worker/type';
import { RelayStoreType } from 'store/relayReducer';
import styled from 'styled-components';
import RelayAdder from './RelayAdder';
import RelayRemover from './RelayRemover';

export interface State {
  loginReducer: {
    isLoggedIn: boolean;
  };
  relayReducer: RelayStoreType;
}

const mapStateToProps = (state: State) => {
  return {
    isLoggedIn: state.loginReducer.isLoggedIn,
    myCustomRelay: state.relayReducer,
  };
};

export const styles = {
  rightMenuLi: {
    padding: '5px 0px',
    width: '100%',
    display: 'block',
  },
  simpleUl: {
    padding: '0px',
    margin: '20px 0px',
    listStyle: 'none' as const,
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
};

export interface RelayManagerProps {
  isLoggedIn;
  myCustomRelay: RelayStoreType;
  wsStatusCallback?: (WsConnectStatus: WsConnectStatus) => any;
  newConnCallback?: (conns: string[]) => any;
  newDisConnCallback?: (disConns: string[]) => any;
}

export function RelayManager({
  isLoggedIn,
  myCustomRelay,
  wsStatusCallback,
  newConnCallback,
}: RelayManagerProps) {
  const { t } = useTranslation();
  const [relays, setRelays] = useState<string[]>([]);

  const myPublicKey = useReadonlyMyPublicKey();

  const [wsConnectStatus, setWsConnectStatus] = useState<WsConnectStatus>(
    new Map(),
  );
  const [newConn, setNewConn] = useState<string[]>([]);
  const [newDisConn, setNewDisConn] = useState<string[]>([]);

  // new connection diff
  useEffect(() => {
    const conns = Array.from(wsConnectStatus)
      .filter(s => s[1] === true)
      .map(s => s[0]);
    const newConnAdd: string[] = [];
    const newConnDelete: string[] = [];
    for (const c of conns) {
      if (!newConn.includes(c)) {
        newConnAdd.push(c);
      }
      if (wsConnectStatus.get(c) === false && newConn.includes(c)) {
        newConnDelete.push(c);
      }
      if (newConn.includes(c) && !newConnDelete.includes(c)) {
        newConnDelete.push(c);
      }
    }

    setNewConn(prev => {
      let arr = prev;
      arr = arr.concat(newConnAdd);
      return arr.filter(s => !newConnDelete.includes(s));
    });
  }, [wsConnectStatus]);

  useEffect(() => {
    if (newConnCallback) {
      newConnCallback(newConn);
    }
  }, [newConn]);

  const [worker, setWorker] = useState<CallWorker>();

  function _wsConnectStatus() {
    return wsConnectStatus;
  }

  useEffect(() => {
    if (wsStatusCallback) {
      wsStatusCallback(wsConnectStatus);
    }
  }, [wsConnectStatus]);

  useEffect(() => {
    const worker = new CallWorker((message: FromWorkerMessageData) => {
      if (message.wsConnectStatus) {
        if (equalMaps(_wsConnectStatus(), message.wsConnectStatus)) {
          // no changed
          console.debug('[wsConnectStatus] same, not updating');
          return;
        }

        const data = Array.from(message.wsConnectStatus.entries());
        setWsConnectStatus(prev => {
          const newMap = new Map(prev);
          for (const d of data) {
            const relayUrl = d[0];
            const isConnected = d[1];
            if (newMap.get(relayUrl) && newMap.get(relayUrl) === isConnected) {
              continue; // no changed
            }

            newMap.set(relayUrl, isConnected);
          }

          return newMap;
        });
      }
    });
    setWorker(worker);
  }, []);

  useEffect(() => {
    // remove duplicated relay
    let relays = defaultRelays;
    if (isLoggedIn === true) {
      relays = relays
        .concat(...(myCustomRelay[myPublicKey] ?? []))
        .filter((item, index, self) => self.indexOf(item) === index);
    }

    setRelays(relays);
  }, [myPublicKey, myCustomRelay]);

  {
    useEffect(() => {
      if (relays.length === 0) return;
      if (worker == null) return;

      worker?.addRelays(relays);
    }, [relays]);
  }
  // show relay status
  const relayerStatusUI: any[] = [];
  const relayerStatusIds: string[] = [];

  const connectStatusArray = Array.from(wsConnectStatus.entries());
  for (const url of relays) {
    let status = connectStatusArray.filter(c => c[0] === url).map(c => c[1])[0];
    if (status == null) {
      // not found, it is not connected
      status = false;
    }

    const style = status ? styles.connected : styles.disconnected;
    const item = (
      <li style={styles.rightMenuLi} key={url}>
        <Grid container style={{ fontSize: '14px' }}>
          <Grid item xs={12} sm={8}>
            <span style={style}> · </span>
            <span style={{ color: 'gray' }}>
              <Link href={'/backup?relay=' + url}>{url}</Link>
            </span>
          </Grid>
          <Grid item xs={12} sm={4}>
            {myPublicKey && !defaultRelays.includes(url) && (
              <RelayRemover publicKey={myPublicKey} url={url} />
            )}
          </Grid>
        </Grid>
      </li>
    );

    const index = relayerStatusIds.findIndex(v => v === url);
    if (index != -1) {
      relayerStatusUI[index] = item;
    } else {
      relayerStatusIds[relayerStatusIds.length] = url;
      relayerStatusUI[relayerStatusUI.length] = item;
    }
  }

  return (
    <div>
      <h3>
        {t('relayManager.title')}({relays.length})
      </h3>
      <ul style={styles.simpleUl}>{relayerStatusUI}</ul>
      <RelayAdder publicKey={myPublicKey} />
    </div>
  );
}

export default connect(mapStateToProps)(RelayManager);

const Link = styled.a`
  textdecoration: none;
  color: gray;
  :hover {
    textdecoration: underline;
  }
`;
