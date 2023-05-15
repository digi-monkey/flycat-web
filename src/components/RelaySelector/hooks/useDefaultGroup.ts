import { useReadonlyMyPublicKey } from "hooks/useMyPublicKey";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { seedRelays } from "service/relay/seed";
import { Relay } from "service/relay/type";
import { RootState } from "store/configureStore";

export function useDefaultGroup(){
	const myPublicKey = useReadonlyMyPublicKey();
	const isLoggedIn = useSelector(
    (state: RootState) => state.loginReducer.isLoggedIn,
  );
	const myCustomRelay = useSelector(
    (state: RootState) => state.relayReducer,
  );

	const [defaultGroup, setDefaultGroup] = useState<Relay[]>();

	useEffect(() => {
    // remove duplicated relay
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
	
			}
		})
    setDefaultGroup(relays);
  }, [isLoggedIn, myCustomRelay]);

	return defaultGroup;
}
