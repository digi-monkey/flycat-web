import { UserMap } from 'service/type';
import { connect } from 'react-redux';
import { useRouter } from 'next/router';
import { useCallWorker } from 'hooks/useWorker';
import { EventWithSeen } from 'pages/type';
import { useTranslation } from 'next-i18next';
import { getEventIdsFromETags } from 'utils/nostr';
import { loginMapStateToProps } from 'pages/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import React, { useState, useEffect } from 'react';
import { deserializeMetadata } from 'service/event/content';
import { isEventPTag } from 'service/event/util';
import {
  EventSetMetadataContent,
  WellKnownEventKind,
  PublicKey,
  RelayUrl,
  PetName
} from 'service/event/type';
import { Event } from 'service/event/Event';
import PostItems from 'components/PostItems';
import { Avatar, Segmented, Input } from 'antd';
import styles from './index.module.scss';
import { TreeNode } from './tree';
import { SubPostItem } from 'components/PostItems/PostContent';
import { CommentInput } from './CommentInput';

export type ContactList = Map<
  PublicKey,
  {
    relayer: RelayUrl;
    name: PetName;
  }
>;

export const EventPage = ({ isLoggedIn }) => {
  const { t } = useTranslation();
  const { eventId } = useRouter().query as { eventId: string };

  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn, wsConnectStatus } = useCallWorker();

  const [unknownPks, setUnknownPks] = useState<PublicKey[]>([]);
  const [sentMsgIds, setSentMsgIds] = useState<string[]>([]);
  const [commentList, setCommentList] = useState<EventWithSeen[]>([]);
  const [threadTreeNodes, setThreadTreeNodes] = useState<
    TreeNode<EventWithSeen>[]
  >([]);
  const [rootEvent, setRootEvent] = useState<EventWithSeen>();
  const [userMap, setUserMap] = useState<UserMap>(new Map());

  function handEvent(event: Event, relayUrl?: string) {
    switch (event.kind) {
      case WellKnownEventKind.set_metadata:
        const metadata: EventSetMetadataContent = deserializeMetadata(
          event.content,
        );
        setUserMap(prev => {
          const newMap = new Map(prev);
          const oldData = newMap.get(event.pubkey);
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

      case WellKnownEventKind.article_highlight:
      case WellKnownEventKind.long_form:
      case WellKnownEventKind.text_note:
        {
          if (event.id === eventId) {
            if (rootEvent == null) {
              setRootEvent({ ...event, ...{ seen: [relayUrl!] } });
            } else {
              if (!rootEvent.seen?.includes(relayUrl!)) {
                rootEvent.seen?.push(relayUrl!);
                setRootEvent(rootEvent);
              }
            }

            return;
          }

          setCommentList(oldArray => {
            const replyToEventIds = oldArray
              .map(e => getEventIdsFromETags(e.tags))
              .reduce((prev, current) => prev.concat(current), []);
            const eTags = getEventIdsFromETags(event.tags);
            if (
              !oldArray.map(e => e.id).includes(event.id) &&
              (replyToEventIds.includes(event.id) ||
                eTags.includes(eventId) ||
                event.id === eventId)
            ) {
              // only add un-duplicated and replyTo msg
              const newItems = [
                ...oldArray,
                { ...event, ...{ seen: [relayUrl!] } },
              ];
              // sort by timestamp in asc
              const sortedItems = newItems.sort((a, b) =>
                a.created_at >= b.created_at ? 1 : -1,
              );

              // check if need to sub new user metadata
              const newPks: PublicKey[] = [];
              for (const t of event.tags) {
                if (isEventPTag(t)) {
                  const pk = t[1];
                  if (userMap.get(pk) == null && !unknownPks.includes(pk)) {
                    newPks.push(pk);
                  }
                }
              }
              if (
                userMap.get(event.pubkey) == null &&
                !unknownPks.includes(event.pubkey)
              ) {
                newPks.push(event.pubkey);
              }
              if (newPks.length > 0) {
                setUnknownPks([...unknownPks, ...newPks]);
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
        break;

      default:
        break;
    }
  }

  useEffect(() => {
    worker?.subMsgByEventIds([eventId])?.iterating({ cb: handEvent });
    worker?.subMsgByETags([eventId])?.iterating({ cb: handEvent });
  }, [newConn]);

  useEffect(() => {
    if (myPublicKey.length > 0) {
      worker?.subMetadata([myPublicKey])?.iterating({ cb: handEvent });
    }
  }, [myPublicKey, newConn]);

  useEffect(() => {
    if (unknownPks.length > 0) {
      worker?.subMetadata(unknownPks)?.iterating({ cb: handEvent });
    }
  }, [unknownPks, newConn]);

  useEffect(() => {
    const msgIds = commentList.map(e => e.id);
    if (msgIds.length > 0) {
      worker?.subMsgByETags(msgIds)?.iterating({ cb: handEvent });
    }
  }, [commentList.length]);

  useEffect(() => {
    if (worker == null) return;

    if (commentList.length === 0) {
      worker.subMsgByETags([eventId])?.iterating({ cb: handEvent });
    }
  }, [worker, eventId]);

  useEffect(() => {
    if (!worker) return;

    const msgIds = commentList.map(m => m.id);
    const newIds = msgIds.filter(id => sentMsgIds.includes(id));
    const pks = commentList
      .filter(event => newIds.includes(event.id))
      .map(event => event.pubkey);
    worker.subMsgByETags(newIds)?.iterating({ cb: handEvent });
    worker.subMetadata(pks)?.iterating({ cb: handEvent });
    setSentMsgIds(prev => [...prev, ...newIds]);
  }, [worker, commentList.length]);

  useEffect(() => {
    buildThreadNodes();
  }, [commentList.length]);

  // todo: better tree algo 
  const buildThreadNodes = () => {
    const ids = threadTreeNodes.map(t => t.value.id);
    for (const comment of commentList) {
      if (!ids.includes(comment.id)) {
        const node = new TreeNode(comment);
        const parentIds = getEventIdsFromETags(comment.tags);
        for (const id of parentIds) {
          if (ids.includes(id)) {
            const parentNodes = threadTreeNodes.filter(n => n.value.id === id);
            {
              for (const parent of parentNodes) {
                if (
                  !parent.children.map(n => n.value.id).includes(node.value.id)
                ) {
                  parent.addChild(node);
                }
              }
            }
          }
        }
        threadTreeNodes.push(node);
      }
    }

    const newThreadTreeNodes = truncateThreadNodes(threadTreeNodes);
    setThreadTreeNodes(newThreadTreeNodes);
  };
  const truncateThreadNodes = (threadTreeNodes: TreeNode<EventWithSeen>[]) => {
    let newThreadNodes: TreeNode<EventWithSeen>[] = threadTreeNodes;
    for (const node of threadTreeNodes) {
      const ids = node.children.map(n => n.value.id);
      for (const otherNode of threadTreeNodes.filter(
        n => n.value.id !== node.value.id,
      )) {
        if (ids.includes(otherNode.value.id)) {
          newThreadNodes = newThreadNodes.filter(
            n => n.value.id !== otherNode.value.id,
          );
        }
      }
    }
    return newThreadNodes;
  };

  const relayUrls = Array.from(wsConnectStatus.keys());

  return (
    <BaseLayout>
      <Left>
        <div>
          <h3>{t('thread.title')}</h3>

          <div>
            <div>
              {rootEvent && (
                <PostItems
                  msgList={[rootEvent]}
                  worker={worker!}
                  userMap={userMap}
                  relays={relayUrls}
                />
              )}
            </div>
            <div className={styles.repliesHeader}>
              <div className={styles.title}>
                Replies{`(${commentList.length})`}
              </div>
              <div className={styles.tab}>
                <Segmented options={['recent', 'hot', 'zapest']} />
              </div>
            </div>

            {rootEvent && <CommentInput worker={worker!} replyTo={rootEvent} userMap={userMap} />}
            
            {threadTreeNodes.map(n => (
              <div key={n.value.id}>
                <PostItems
                  msgList={[{ ...n.value, ...{ seen: [''] } }]}
                  worker={worker!}
                  userMap={userMap}
                  relays={[]}
                  showLastReplyToEvent={false}
                />
                <div className={styles.subRepliesContainer}>
                  {n.children.map(c => (
                    <SubPostItem key={c.value.id} event={c.value} userMap={userMap} />
                  ))}
                </div>
                <br />
                <br />
              </div>
            ))}
          </div>
        </div>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(EventPage);

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});

export const getStaticPaths = () => ({ paths: [], fallback: true });
