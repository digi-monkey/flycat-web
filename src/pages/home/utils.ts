import { CallRelayType } from 'service/worker/type';
import {
  Event,
  EventSetMetadataContent,
  WellKnownEventKind,
  PublicKey,
  RelayUrl,
  PetName,
  EventTags,
  EventContactListPTag,
  RawEvent,
  isEventPTag,
  Filter,
  deserializeMetadata,
} from 'service/api';

export function handleEvent(worker, isLoggedIn, userMap, myPublicKey, setUserMap, setGlobalMsgList, setMsgList, setMyContactList) {
  return function handleEvent(event: Event, relayUrl?: string) {
    const maxMsgLength = 50;
    console.debug(`[${worker?._workerId}]receive event`, relayUrl, event.kind);
    switch (event.kind) {
      case WellKnownEventKind.set_metadata:
        const metadata: EventSetMetadataContent = deserializeMetadata(event.content);
        setUserMap(prev => {
          const newMap = new Map(prev);
          const oldData = newMap.get(event.pubkey) as {created_at: number};
          if (oldData && oldData.created_at > event.created_at) {
            // the new data is outdated
            return newMap;
          }

          newMap.set(event.pubkey, {
            ...metadata,
            ...{ created_at: event.created_at },
          });
          return newMap;
        });
        break;

      case WellKnownEventKind.text_note:
        if (!isLoggedIn) {
          setGlobalMsgList(oldArray => {
            if (!oldArray.map(e => e.id).includes(event.id)) {
              // do not add duplicated msg
              const newItems = [...oldArray, event];
              // sort by timestamp
              const sortedItems = newItems.sort((a, b) =>
                a.created_at >= b.created_at ? -1 : 1,
              );

              // check if need to sub new user metadata
              const newPks: string[] = [event.pubkey];
              for (const t of event.tags) {
                if (isEventPTag(t)) {
                  const pk = t[1];
                  if (userMap.get(pk) == null) {
                    newPks.push(pk);
                  }
                }
              }
              if (newPks.length > 0) {
                const sub = worker?.subMetadata(newPks, false, 'homeMetadata', {
                  type: CallRelayType.single,
                  data: [relayUrl!],
                });
                sub?.iterating({ cb: handleEvent });
              }

              return sortedItems;
            }
            return oldArray;
          });

          return;
        }

        setMsgList(oldArray => {
          if (
            oldArray.length > maxMsgLength &&
            oldArray[oldArray.length - 1].created_at > event.created_at
          ) {
            return oldArray;
          }

          if (!oldArray.map(e => e.id).includes(event.id)) {
            // do not add duplicated msg

            // check if need to sub new user metadata
            const newPks: string[] = [];
            for (const t of event.tags) {
              if (isEventPTag(t)) {
                const pk = t[1];
                if (userMap.get(pk) == null) {
                  newPks.push(pk);
                }
              }
            }
            if (newPks.length > 0) {
              const sub = worker?.subMetadata(newPks, false, undefined, {
                type: CallRelayType.single,
                data: [relayUrl!],
              });
              sub?.iterating({ cb: handleEvent });
            }

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

        break;

      case WellKnownEventKind.contact_list:
        if (event.pubkey === myPublicKey) {
          setMyContactList(prev => {
            if (prev && prev?.created_at >= event.created_at) {
              return prev;
            }

            const keys = (
              event.tags.filter(
                t => t[0] === EventTags.P,
              ) as EventContactListPTag[]
            ).map(t => t[1]);
            return {
              keys,
              created_at: event.created_at,
            };
          });
        }
        break;

      default:
        break;
    }
  }
}

export async function onSubmitText(text: string, signEvent, myPublicKey, worker) {
  if (signEvent == null) {
    return alert('no sign method!');
  }

  const rawEvent = new RawEvent(
    myPublicKey,
    WellKnownEventKind.text_note,
    undefined,
    text,
  );
  const event = await signEvent(rawEvent);
  worker?.pubEvent(event);
}
