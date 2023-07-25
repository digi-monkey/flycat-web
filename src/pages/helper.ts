import { Dispatch, SetStateAction } from 'react';
import { RootState } from 'store/configureStore';
import { EventWithSeen } from './type';
import { Event } from 'core/nostr/Event';
import { EventMap } from 'core/nostr/type';

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

export const setMaxLimitEventWithSeenMsgList = (event: Event, relayUrl: string, setMsgList: Dispatch<SetStateAction<EventWithSeen[]>>, maxMsgLength: number) => {
  return setMsgList(oldArray => {
    if (
      oldArray.length > maxMsgLength &&
      oldArray[oldArray.length - 1].created_at > event.created_at
    ) {
      return oldArray;
    }

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
      // cut to max size
      if (sortedItems.length > maxMsgLength) {
        return sortedItems.slice(0, maxMsgLength + 1);
      }
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

export const pushEventWithSeenMsgList = (event: Event, relayUrl: string, msgList:EventWithSeen[]) => {
  const oldArray = msgList;
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
}

export const pushMaxLimitEventWithSeenMsgList = (event: Event, relayUrl: string, msgList: EventWithSeen[], maxMsgLength: number) => {
  const oldArray = msgList;
  if (
    oldArray.length > maxMsgLength &&
    oldArray[oldArray.length - 1].created_at > event.created_at
  ) {
    return oldArray;
  }

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
    // cut to max size
    if (sortedItems.length > maxMsgLength) {
      return sortedItems.slice(0, maxMsgLength + 1);
    }
    return sortedItems;
  } else {
    const id = oldArray.findIndex(s => s.id === event.id);
    if (id === -1) return oldArray;

    if (!oldArray[id].seen?.includes(relayUrl!)) {
      oldArray[id].seen?.push(relayUrl!);
    }
  }
  return oldArray;
}

export const onSetEventMap = (event: Event, setEventMap: Dispatch<SetStateAction<EventMap>>) => {
  return setEventMap(prev => {
    const newMap = new Map(prev);
    const oldData = newMap.get(event.id);
    if (oldData && oldData.created_at > event.created_at) {
      // the new data is outdated
      return newMap;
    }
  
    newMap.set(event.id, event);
    return newMap;
  });  
}

