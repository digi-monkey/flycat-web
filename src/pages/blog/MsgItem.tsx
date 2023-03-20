import { Grid } from '@mui/material';
import { Content } from 'components/layout/msg/Content';
import { ReplyToUserList } from 'components/layout/msg/ReplyToUserList';
import {
  ProfileAvatar,
  ProfileName,
  ProfileReactionGroups,
  ReactionGroups,
} from 'components/layout/msg/TextMsg';
import React from 'react';
import { Event, EventTags } from 'service/api';
import { maxStrings } from 'service/helper';
import { Nip23, Nip23ArticleMetaTags } from 'service/nip/23';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';

export interface BlogMsgItemProps {
  userAvatar?: string;
  userName?: string;
  event: Event;
  userMap: UserMap;
  worker?: CallWorker;
  seen?: string[];
  relays?: string[];
}

export function BlogMsgItem({
  userAvatar,
  userName,
  event,
  userMap,
  worker,
  seen,
  relays,
}: BlogMsgItemProps) {
  const title: string | undefined = event.tags
    .filter(t => t[0] === Nip23ArticleMetaTags.title)
    .map(t => t[1])[0];
  const summary: string | undefined = event.tags
    .filter(t => t[0] === Nip23ArticleMetaTags.summary)
    .map(t => t[1])[0];
  const image: string | undefined = event.tags
    .filter(t => t[0] === Nip23ArticleMetaTags.image)
    .map(t => t[1])[0];
  const addr: string = event.tags
    .filter(t => t[0] === EventTags.A)
    .map(t => t[1])[0];

  const replyTo: { name?: string; pk: string }[] = event.tags
    .filter(t => t[0] === EventTags.P)
    .map(t => {
      return {
        name: userMap.get(t[1])?.name,
        pk: t[1],
      };
    });

  return (
    <li
      style={{
        display: 'block',
        borderBottom: '1px dashed #ddd',
        padding: '15px 0',
        wordBreak: 'break-all',
      }}
      key={event.id}
    >
      <Grid container>
        <div style={{ width: '75px', minWidth: '75px' }}>
          <ProfileAvatar picture={userAvatar} name={event.pubkey} />
        </div>

        <div style={{ flex: '1', maxWidth: '100%' }}>
          <span style={{ fontSize: '14px', display: 'block' }}>
            <ProfileName
              name={userName}
              pk={event.pubkey}
              createdAt={event.created_at}
            />
            <ReplyToUserList replyTo={replyTo} />
            <ArticleMsgContent
              text={event.content}
              title={title}
              summary={summary}
              image={image}
              addr={addr}
            />
          </span>
          <ReactionGroups
            seen={seen}
            relays={relays}
            msgEvent={event}
            worker={worker!}
            pk={event.pubkey}
            eventId={event.id}
            lightingAddress={
              userMap.get(event.pubkey)?.lud06 ||
              userMap.get(event.pubkey)?.lud16
            }
          />
        </div>
      </Grid>
    </li>
  );
}

export function ProfileBlogMsgItem({
  event,
  userMap,
  worker,
}: {
  event: Event;
  userMap: UserMap;
  worker: CallWorker;
}) {
  const title: string | undefined = event.tags
    .filter(t => t[0] === Nip23ArticleMetaTags.title)
    .map(t => t[1])[0];
  const summary: string | undefined = event.tags
    .filter(t => t[0] === Nip23ArticleMetaTags.summary)
    .map(t => t[1])[0];
  const image: string | undefined = event.tags
    .filter(t => t[0] === Nip23ArticleMetaTags.image)
    .map(t => t[1])[0];
  const addr: string = event.tags
    .filter(t => t[0] === EventTags.A)
    .map(t => t[1])[0];

  const replyTo: { name?: string; pk: string }[] = event.tags
    .filter(t => t[0] === EventTags.P)
    .map(t => {
      return {
        name: userMap.get(t[1])?.name,
        pk: t[1],
      };
    });

  return (
    <li
      style={{
        display: 'block',
        borderBottom: '1px dashed #ddd',
        padding: '15px 0',
      }}
    >
      <div>
        <ReplyToUserList replyTo={replyTo} />
        <ArticleMsgContent
          text={event.content}
          title={title}
          summary={summary}
          image={image}
          addr={addr}
        />
      </div>
      <ProfileReactionGroups
        eventId={event.id}
        pk={event.pubkey}
        createdAt={event.created_at}
        worker={worker}
        lightingAddress={
          userMap.get(event.pubkey)?.lud06 || userMap.get(event.pubkey)?.lud16
        }
      />
    </li>
  );
}

export interface ArticleMsgContentProps {
  text: string;
  addr: string;
  title?: string;
  image?: string;
  summary?: string;
}

export function ArticleMsgContent({
  text,
  title,
  image,
  summary,
  addr,
}: ArticleMsgContentProps) {
  return (
    <span>
      <div style={{ fontSize: '14px' }}>
        <Content text={text} />
      </div>
      <div
        style={{
          margin: '10px 0px',
          background: 'rgb(247, 245, 235)',
          borderRadius: '5px',
        }}
        onClick={() => {
          const url = Nip23.addrToUrl(addr);
          window.open(url, '_blank');
        }}
      >
        <div style={{ margin: '5px 0px', padding: '10px' }}>
          <div style={{ display: 'flex', cursor: 'pointer' }}>
            {image && (
              <span
                style={{
                  width: '100px',
                  height: '100px',
                  marginRight: '10px',
                }}
              >
                <img src={image} alt="" style={{ width: '100%' }} />
              </span>
            )}

            <div style={{}}>
              <span
                style={{
                  fontSize: '16px',
                  marginBottom: '5px',
                  display: 'block',
                  textTransform: 'capitalize',
                }}
              >
                {title}
              </span>
              <p style={{ fontSize: '12px', color: 'gray' }}>
                {maxStrings(summary || '', 140)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </span>
  );
}
