import { useEffect } from "react";
import { CallRelayType } from "service/worker/type";
import { WellKnownEventKind } from "service/api";

export function useSubMetaDataAndContactList(myPublicKey, newConn, isLoggedIn, worker, handleEvent) {
  useEffect(() => {
    if (isLoggedIn !== true) return;
    if (!myPublicKey || myPublicKey.length === 0) return;
  
    const callRelay =
      newConn.length === 0
        ? { type: CallRelayType.all, data: [] }
        : { type: CallRelayType.batch, data: newConn };
    const sub = worker?.subMetaDataAndContactList([myPublicKey], false, 'userMetaAndContact', callRelay);
    sub?.iterating({
      cb: handleEvent,
    });
  }, [myPublicKey, newConn]);
}

export function useSubMetadata(myContactList, myPublicKey, newConn, worker, handleEvent) {
  useEffect(() => {
    if (!myContactList || myContactList?.keys?.length === 0) return;
  
    const pks = myContactList.keys;
    // subscribe myself msg too
    if (myPublicKey && !pks.includes(myPublicKey) && myPublicKey.length > 0) pks.push(myPublicKey);
  
    if (pks.length > 0 && newConn.length > 0) {
      const callRelay = {
        type: CallRelayType.batch,
        data: newConn,
      };
      const subMetadata = worker?.subMetadata(pks, false, 'homeMetadata', callRelay );
      subMetadata?.iterating({
        cb: handleEvent,
      });
  
      const subMsg = worker?.subMsg(pks, true, 'homeMsg', callRelay);
      subMsg?.iterating({
        cb: handleEvent,
      });

    }
  }, [myContactList?.created_at, newConn]);
}

export function useSubFilter(isLoggedIn, newConn, worker, handleEvent) {
  useEffect(() => {
    if (isLoggedIn) return;
    if (newConn.length === 0) return;
  
    const sub = worker?.subFilter({
      kinds: [WellKnownEventKind.text_note],
      limit: 50,
    }, undefined, undefined, {
      type: CallRelayType.batch,
      data: newConn,
    });

    sub?.iterating({
      cb: handleEvent,
    });

  }, [isLoggedIn, newConn]);
}
