import { Divider, Segmented, Tag } from 'antd';
import ReplyEventInput from 'components/ReplyNoteInput';
import { EventWithSeen } from 'pages/type';
import { useCallWorker } from 'hooks/useWorker';

import styles from './index.module.scss';
import { UserMap, EventMap, PublicKey } from 'core/nostr/type';
import { useEffect, useState } from 'react';
import { TreeNode } from './tree';
import { useSubReplyEvents, useSubUserMetadata } from './hooks';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { _handleEvent } from './util';
import { getEventIdsFromETags } from 'core/nostr/util';
import { SubPostItem } from 'components/PostItems/PostContent';
import PostItems from 'components/PostItems';
import classNames from 'classnames';
import { CallRelayType } from 'core/worker/type';

export interface CommentsProps {
  rootEvent: EventWithSeen;
  className?: string;
}

const Comments: React.FC<CommentsProps> = ({ rootEvent, className }) => {
  const myPublicKey = useReadonlyMyPublicKey();

  const { worker, newConn } = useCallWorker();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [eventMap, setEventMap] = useState<EventMap>(new Map());
  const [commentList, setCommentList] = useState<EventWithSeen[]>([]);
  const [unknownPks, setUnknownPks] = useState<PublicKey[]>([]);
  const [commentOrder, setCommentOrder] = useState<string>('recent');
  const [newPubReplyEvent, setNewPubReplyEvent] = useState<EventWithSeen[]>([]);

  const [threadTreeNodes, setThreadTreeNodes] = useState<
    TreeNode<EventWithSeen>[]
  >([]);

  const handleEvent = _handleEvent({
    userMap,
    setUserMap,
    setEventMap,
    rootEvent,
    setCommentList,
    unknownPks,
    setUnknownPks,
  });

  useSubReplyEvents({
    newConn,
    rootEvent,
    commentList,
    worker,
    handleEvent,
  });
  useSubUserMetadata({
    rootEvent,
    newConn,
    myPublicKey,
    unknownPks,
    worker,
    handleEvent,
  });

  useEffect(() => {
    buildThreadNodes();
  }, [commentList]);

  // todo: better tree algo
  const buildThreadNodes = () => {
    setThreadTreeNodes(threadTreeNodes => {
      const ids = threadTreeNodes.map(t => t.value.id);
      for (const comment of commentList) {
        if (!ids.includes(comment.id)) {
          const node = new TreeNode(comment);
          const parentIds = getEventIdsFromETags(comment.tags);
          for (const id of parentIds) {
            if (ids.includes(id)) {
              const parentNodes = threadTreeNodes.filter(
                n => n.value.id === id,
              );
              {
                for (const parent of parentNodes) {
                  if (
                    !parent.children
                      .map(n => n.value.id)
                      .includes(node.value.id)
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
      return newThreadTreeNodes;
    });

    // setThreadTreeNodes(newThreadTreeNodes);
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

  const successCb = (eventId, relayUrls) => {
    worker
      ?.subMsgByEventIds([eventId], undefined, {
        type: CallRelayType.batch,
        data: relayUrls,
      })
      .iterating({
        cb: event => {
          setNewPubReplyEvent(prev => {
            if (prev.map(prev => prev.id).includes(event.id)) {
              return prev;
            }

            const newArr = [...[{ ...event, ...{ seen: relayUrls } }], ...prev];
            return newArr;
          });
        },
      });
  };

  return (
    <div className={classNames(className)}>
      <div className={classNames(styles.repliesHeader)}>
        <div className={styles.header}>
          <div className={styles.title}>Replies{`(${commentList.length})`}</div>
          <div>
            <Segmented
              className={styles.tab}
              options={['recent', 'hot', 'zapest']}
              onChange={val => setCommentOrder(val as string)}
              value={commentOrder}
            />
          </div>
        </div>
        <ReplyEventInput
          worker={worker!}
          replyTo={rootEvent}
          userMap={userMap}
          successCb={successCb}
        />
      </div>

      {/** todo: fix the following hack */}
      <PostItems
        msgList={newPubReplyEvent}
        worker={worker!}
        userMap={userMap}
        eventMap={eventMap}
        relays={worker?.relays.map(r => r.url) || []}
        showLastReplyToEvent={false}
      />

      {commentOrder === 'recent' &&
        threadTreeNodes.map(n => (
          <div key={n.value.id}>
            <PostItems
              msgList={[{ ...n.value, ...{ seen: [''] } }]}
              worker={worker!}
              userMap={userMap}
              eventMap={eventMap}
              relays={worker?.relays.map(r => r.url) || []}
              showLastReplyToEvent={false}
            />
            <div className={styles.subRepliesContainer}>
              {n.children.map(c => (
                <SubPostItem
                  key={c.value.id}
                  event={c.value}
                  userMap={userMap}
                />
              ))}
            </div>
            <br />
            <br />
          </div>
        ))}

      {commentOrder !== 'recent' && (
        <Divider orientation="left">
          <Tag color="error">Feature Under Construction 🚧</Tag>
        </Divider>
      )}
    </div>
  );
};

export default Comments;
