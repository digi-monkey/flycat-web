import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { loadTempMyPublicKey, saveTempMyPublicKey } from 'store/loginReducer';

export function useMyPublicKey() {
  const getMyPublicKey = useSelector(
    (state: RootState) => state.loginReducer.getPublicKey,
  );

  const [myPublicKey, setMyPublicKey] = useState<string>('');
  const isExtensionLoaded = useIsExtensionLoaded();

  const doSetMyPublicKey = async () => {
    try {
      // todo: manage in one place
      const pk = loadTempMyPublicKey();
      if (pk) {
        setMyPublicKey(pk);
      } else {
        const pk = await getMyPublicKey();
        setMyPublicKey(pk);
        saveTempMyPublicKey(pk);
      }
    } catch (error: any) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    doSetMyPublicKey();
  }, [getMyPublicKey, isExtensionLoaded]);

  return myPublicKey;
}

export function useReadonlyMyPublicKey() {
  const isLoggedIn = useSelector(
    (state: RootState) => state.loginReducer.isLoggedIn,
  );
  const [myPublicKey, setMyPublicKey] = useState<string>('');

  useEffect(() => {
    const pk = loadTempMyPublicKey();
    if (pk != null) setMyPublicKey(pk);
  }, [isLoggedIn]);

  return myPublicKey;
}

export function useIsExtensionLoaded() {
  const [isExtensionLoaded, setIsExtensionLoaded] = useState(false);

  useEffect(() => {
    function handleExtensionLoaded() {
      setIsExtensionLoaded(true);
    }

    // Listen for the DOMContentLoaded event
    window.addEventListener('load', () => {
      if (window.nostr) {
        handleExtensionLoaded();
        console.info('DOMContentLoaded!');
      }
    });

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('load', handleExtensionLoaded);
    };
  }, []);

  return isExtensionLoaded;
}
