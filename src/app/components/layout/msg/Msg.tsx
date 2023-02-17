import { TextNoteEvent } from 'app/type';
import { t } from 'i18next';
import React from 'react';
import { EventTags, Event, PrivateKey, PublicKey } from 'service/api';
import { isFlycatShareHeader, CacheIdentifier } from 'service/flycat-protocol';
import { getPkFromFlycatShareHeader } from 'service/helper';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import { ShareMsg } from './ShareMsg';
import { TextMsg } from './TextMsg';

export interface KeyPair {
  publicKey: PublicKey;
  privateKey: PrivateKey;
}

export const Msgs = (
  msgList: TextNoteEvent[],
  worker: CallWorker,
  myKeyPair: KeyPair,
  userMap: UserMap,
  relays: string[],
) => {
  return msgList.map((msg, index) => {
    //@ts-ignore
    const flycatShareHeaders: FlycatShareHeader[] = msg.tags.filter(t =>
      isFlycatShareHeader(t),
    );
    if (flycatShareHeaders.length > 0) {
      const blogPk = getPkFromFlycatShareHeader(
        flycatShareHeaders[flycatShareHeaders.length - 1],
      );
      const cacheHeaders = msg.tags.filter(t => t[0] === CacheIdentifier);
      let articleCache = {
        title: t('thread.noArticleShareTitle'),
        url: '',
        blogName: t('thread.noBlogShareName'),
        blogPicture: '',
      };
      if (cacheHeaders.length > 0) {
        const cache = cacheHeaders[cacheHeaders.length - 1];
        articleCache = {
          title: cache[1],
          url: cache[2],
          blogName: cache[3],
          blogPicture: cache[4],
        };
      }
      return (
        <ShareMsg
          worker={worker!}
          key={msg.id}
          content={msg.content}
          eventId={msg.id}
          keyPair={myKeyPair}
          userPk={msg.pubkey}
          userAvatar={userMap.get(msg.pubkey)?.picture}
          username={userMap.get(msg.pubkey)?.name}
          createdAt={msg.created_at}
          blogName={articleCache.blogName} //todo: fallback to query title
          blogAvatar={articleCache.blogPicture || userMap.get(blogPk)?.picture}
          articleTitle={articleCache.title} //todo: fallback to query title
        />
      );
    } else {
      return (
        <TextMsg
          seen={msg.seen}
          relays={relays}
          worker={worker!}
          key={msg.id}
          pk={msg.pubkey}
          avatar={userMap.get(msg.pubkey)?.picture}
          name={userMap.get(msg.pubkey)?.name}
          content={msg.content}
          eventId={msg.id}
          keyPair={myKeyPair}
          replyTo={msg.tags
            .filter(t => t[0] === EventTags.P)
            .map(t => {
              return {
                name: userMap.get(t[1])?.name,
                pk: t[1],
              };
            })}
          createdAt={msg.created_at}
        />
      );
    }
  });
};
