import { Dispatch, SetStateAction, useEffect } from 'react';
import { CallRelayType } from 'core/worker/type';
import { PublicKey, WellKnownEventKind } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { EventWithSeen } from 'pages/type';
import { CallWorker } from 'core/worker/caller';
import { handleEvent } from './utils';
import { UserMap } from 'core/nostr/type';

export function useSubMetaDataAndContactList(
  myPublicKey,
  newConn,
  isLoggedIn,
  worker: CallWorker | undefined,
  handleEvent,
) {
  useEffect(() => {
    if (isLoggedIn !== true) return;
    if (!myPublicKey || myPublicKey.length === 0) return;

    const callRelay =
      newConn.length === 0
        ? { type: CallRelayType.all, data: [] }
        : { type: CallRelayType.batch, data: newConn };
    const sub = worker?.subMetaDataAndContactList(
      [myPublicKey],
      'userMetaAndContact',
      callRelay,
    );
    
    sub?.iterating({
      cb: handleEvent,
    });
  }, [myPublicKey, newConn]);
}

export function useSubMsg(
  myContactList,
  myPublicKey,
  newConn,
  worker,
  handleEvent,
) {
  useEffect(() => {
    const pks = myContactList?.keys || [];
    console.log("contact list:", myContactList);

    // subscribe myself msg too
    if (myPublicKey && !pks.includes(myPublicKey) && myPublicKey.length > 0)
      pks.push(myPublicKey);

    if (pks.length > 0 && newConn.length > 0) {
      const callRelay = {
        type: CallRelayType.batch,
        data: newConn,
      };
      const subMetadata = worker?.subMetadata(
        pks,
        false,
        'homeMetadata',
        callRelay,
      );
      subMetadata?.iterating({
        cb: handleEvent,
      });

      console.log("worker.subMsg:", pks)
      const subMsg = worker?.subMsg(pks, 'homeMsg', callRelay);
      subMsg?.iterating({
        cb: handleEvent,
      });
    }
  }, [myContactList?.created_at, newConn, worker]);
}

export function useLoadMoreMsg({
  isLoggedIn,
  myContactList,
  myPublicKey,
  msgList,
  worker,
  userMap,
  setUserMap,
  setMsgList,
  setMyContactList,
  loadMoreCount,
}: {
  isLoggedIn: boolean;
  myContactList?: { keys: PublicKey[]; created_at: number };
  setMyContactList: Dispatch<
    SetStateAction<
      | {
          keys: PublicKey[];
          created_at: number;
        }
      | undefined
    >
  >;
  myPublicKey: string;
  msgList: EventWithSeen[];
  worker?: CallWorker;
  userMap: UserMap;
  setUserMap: Dispatch<SetStateAction<UserMap>>;
  setMsgList: Dispatch<SetStateAction<Event[]>>;
  loadMoreCount: number;
}) {
  useEffect(() => {
    if(loadMoreCount === 1)return; // initial value is 1

    const pks = myContactList?.keys || [];
    // subscribe myself msg too
    if (myPublicKey && !pks.includes(myPublicKey) && myPublicKey.length > 0)
      pks.push(myPublicKey);

    if (pks.length > 0) {
      const lastMsg = msgList.at(msgList.length - 1);
      if (!lastMsg) {
        return;
      }

      const callRelay = {
        type: CallRelayType.connected,
        data: [],
      };

      const subMsg = worker?.subMsg(pks, 'homeMoreMsg', callRelay, {
        until: lastMsg.created_at,
      });
      subMsg?.iterating({
        cb: handleEvent(
          worker,
          isLoggedIn,
          userMap,
          myPublicKey,
          setUserMap,
          setMsgList,
          setMyContactList,
          50 * loadMoreCount,
        ),
      });
    }
  }, [loadMoreCount]);
}
