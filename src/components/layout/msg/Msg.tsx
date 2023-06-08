import React from 'react';
import { Nip23 } from 'service/nip/23';
import { UserMap } from 'service/type';
import { TextMsg } from './TextMsg';
import { EventTags } from 'service/api';
import { CallWorker } from 'service/worker/callWorker';
import { BlogHighlightMsgItem, BlogCommentMsgItem, PublishBlogMsgItem } from 'pages/blog/components/MsgItem/index';
import { EventWithSeen } from 'pages/type';
import { Nip9802 } from 'service/nip/9802';

export const Msgs = ( 
  msgList: EventWithSeen[],
  worker: CallWorker,
  userMap: UserMap,
  relays: string[],
) => {
  return msgList.map((msg, index) => {
    if (Nip23.isBlogPost(msg)){
      return (
        <PublishBlogMsgItem
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
    }else if (Nip23.isBlogCommentMsg(msg)) {
      return (
        <BlogCommentMsgItem
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
    } else if(Nip9802.isBlogHighlightMsg(msg)) {
      return (
        <BlogHighlightMsgItem 
        event={msg}
          seen={msg.seen}
          relays={relays}
          worker={worker!}
          userMap={userMap}
          key={msg.id}
          userAvatar={userMap.get(msg.pubkey)?.picture}
          userName={userMap.get(msg.pubkey)?.name}
        />
      )
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
