import { Grid } from '@mui/material';
import { connect } from 'react-redux';
import { useCallWorker } from 'hooks/useWorker';
import { useTranslation } from 'next-i18next';
import { defaultRelays } from 'service/relay';
import { WsConnectStatus } from 'service/worker/type';
import { RelayStoreType } from 'store/relayReducer';
import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

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
}

const Link = styled.a`
  textdecoration: none;
  color: gray;
  :hover {
    textdecoration: underline;
  }
`;

export function RelayManager({
  isLoggedIn,
  myCustomRelay,
  wsStatusCallback,
  newConnCallback,
}: RelayManagerProps) {
  const { t } = useTranslation();
  const [relays, setRelays] = useState<string[]>([]);

  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn, wsConnectStatus } = useCallWorker();

  useEffect(() => {
    if (newConnCallback) {
      newConnCallback(newConn);
    }
  }, [newConn]);

  useEffect(() => {
    if (wsStatusCallback) {
      wsStatusCallback(wsConnectStatus);
    }
  }, [wsConnectStatus]);

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

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
})
