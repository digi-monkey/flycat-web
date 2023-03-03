import { BlogMsgItem } from 'app/pages/Blog/MsgItem';
import { EventWithSeen } from 'app/type';
import { t } from 'i18next';
import React from 'react';
import { EventTags } from 'service/api';
import { Nip23 } from 'service/nip/23';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import { TextMsg } from './TextMsg';

export const Msgs = (
  msgList: EventWithSeen[],
  worker: CallWorker,
  userMap: UserMap,
  relays: string[],
) => {
  return msgList.map((msg, index) => {
    if (Nip23.isBlogMsg(msg)) {
      return (
        <BlogMsgItem
          event={msg}
          seen={msg.seen}
          relays={relays}
          worker={worker!}
          userMap={userMap}
          key={msg.id}
          userAvatar={userMap.get(msg.pubkey)?.picture}
          userName={userMap.get(msg.pubkey)?.name}
        />
      );
    } else {
      return (
        <TextMsg
          msgEvent={msg}
          relays={relays}
          worker={worker!}
          key={msg.id}
          userMap={userMap}
          replyTo={msg.tags
            .filter(t => t[0] === EventTags.P)
            .map(t => {
              return {
                name: userMap.get(t[1])?.name,
                pk: t[1],
              };
            })}
          lightingAddress={
            userMap.get(msg.pubkey)?.lud06 || userMap.get(msg.pubkey)?.lud16
          }
        />
      );
    }
  });
};
