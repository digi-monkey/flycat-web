import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { seedRelays } from 'core/relay/pool/seed';
import { RootState } from 'store/configureStore';

export function useDefaultRelays() {
  const myPublicKey = useReadonlyMyPublicKey();
  const isLoggedIn = useSelector(
    (state: RootState) => state.loginReducer.isLoggedIn,
  );
  const myCustomRelay = useSelector((state: RootState) => state.relayReducer);

  const defaultRelays = useMemo(() => {
    let relayUrls = seedRelays;
    if (isLoggedIn === true) {
      relayUrls = relayUrls
        .concat(...(myCustomRelay[myPublicKey] ?? []))
        .filter((item, index, self) => self.indexOf(item) === index);
    }

    const relays = relayUrls.map(url => {
      return {
        url,
        read: true,
        write: true,
      };
    });
    return relays;
  }, [isLoggedIn, myCustomRelay, myPublicKey]);

  return defaultRelays;
}
