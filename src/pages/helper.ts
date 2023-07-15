import { Dispatch, SetStateAction } from 'react';
import { RootState } from 'store/configureStore';
import { EventWithSeen } from './type';
import { Event } from 'core/nostr/Event';

export const loginMapStateToProps = (state: RootState) => {
  return {
    mode: state.loginReducer.mode,
    isLoggedIn: state.loginReducer.isLoggedIn,
    getMyPublicKey: state.loginReducer.getPublicKey,
    signEvent: state.loginReducer.signEvent,
    myPublicKey: state.loginReducer.publicKey,
    myPrivateKey: state.loginReducer.privateKey,
  };
};

export const setEventWithSeenMsgList = (event: Event, relayUrl: string, setMsgList: Dispatch<SetStateAction<EventWithSeen[]>>) => {
  return setMsgList(oldArray => {
    if (!oldArray.map(e => e.id).includes(event.id)) {
      // do not add duplicated msg

      // save event
      const newItems = [
        ...oldArray,
        { ...event, ...{ seen: [relayUrl!] } },
      ];
      // sort by timestamp
      const sortedItems = newItems.sort((a, b) =>
        a.created_at >= b.created_at ? -1 : 1,
      );
      return sortedItems;
    } else {
      const id = oldArray.findIndex(s => s.id === event.id);
      if (id === -1) return oldArray;

      if (!oldArray[id].seen?.includes(relayUrl!)) {
        oldArray[id].seen?.push(relayUrl!);
      }
    }
    return oldArray;
  });
}
