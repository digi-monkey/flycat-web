import { BlogMsgItem } from 'app/pages/Blog/MsgItem';
import { EventWithSeen } from 'app/type';
import { t } from 'i18next';
import React from 'react';
import { EventTags, Event, PrivateKey, PublicKey } from 'service/api';
import { isFlycatShareHeader, CacheIdentifier } from 'service/flycat-protocol';
import { getPkFromFlycatShareHeader } from 'service/helper';
import { Nip23 } from 'service/nip/23';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import { ShareMsg } from './ShareMsg';
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
          seen={msg.seen}
          relays={relays}
          worker={worker!}
          key={msg.id}
          pk={msg.pubkey}
          avatar={userMap.get(msg.pubkey)?.picture}
          name={userMap.get(msg.pubkey)?.name}
          content={msg.content}
          eventId={msg.id}
          replyTo={msg.tags
            .filter(t => t[0] === EventTags.P)
            .map(t => {
              return {
                name: userMap.get(t[1])?.name,
                pk: t[1],
              };
            })}
          createdAt={msg.created_at}
          lightingAddress={
            userMap.get(msg.pubkey)?.lud06 || userMap.get(msg.pubkey)?.lud16
          }
        />
      );
    }
  });
};
