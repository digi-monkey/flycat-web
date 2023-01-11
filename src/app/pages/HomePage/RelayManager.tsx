import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { RelayUrl } from 'service/api';
import { defaultRelays } from 'service/relay';
import { RelayStoreType } from 'store/relayReducer';
import RelayAdder from './RelayAdder';

export interface State {
  loginReducer: {
    isLoggedIn: boolean;
    publicKey: string;
    privateKey: string;
  };
  relayReducer: RelayStoreType;
}

const mapStateToProps = (state: State) => {
  return {
    isLoggedIn: state.loginReducer.isLoggedIn,
    myPublicKey: state.loginReducer.publicKey,
    myCustomRelay: state.relayReducer,
  };
};

export type WsConnectStatus = Map<RelayUrl, boolean>;

export const styles = {
  rightMenuLi: {
    padding: '0px',
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
  setRelaysCallback?: (urls: string[]) => any;
  wsConnectStatus: WsConnectStatus;
  isLoggedIn;
  myPublicKey;
  myCustomRelay: RelayStoreType;
}

export function RelayManager({
  setRelaysCallback,
  wsConnectStatus,
  isLoggedIn,
  myPublicKey,
  myCustomRelay,
}: RelayManagerProps) {
  const [relays, setRelays] = useState<string[]>([]);

  useEffect(() => {
    // remove duplicated relay
    let relays = defaultRelays;
    if (isLoggedIn === true) {
      relays = relays
        .concat(...(myCustomRelay[myPublicKey] ?? []))
        .filter((item, index, self) => self.indexOf(item) === index);
    }

    setRelays(relays);
    // callback
    if (setRelaysCallback) {
      setRelaysCallback(relays);
    }
  }, [myPublicKey, myCustomRelay]);

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
        <span style={style}> · </span>
        <a href={url} target="_blank" rel="noreferrer">
          {url}
        </a>
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
      <h3>连接器({relays.length})</h3>
      <ul style={styles.simpleUl}>{relayerStatusUI}</ul>
      <RelayAdder publicKey={myPublicKey} />
    </div>
  );
}

export default connect(mapStateToProps)(RelayManager);
