import ReplyEventInput from 'components/ReplyNoteInput';
import { EventWithSeen } from 'pages/type';
import { useCallWorker } from 'hooks/useWorker';
import { UserMap, EventMap, PublicKey } from 'core/nostr/type';
import { useEffect, useState } from 'react';
import { TreeNode } from './tree';
import { useSubReplyEvents, useSubUserMetadata } from './hooks';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { _handleEvent } from './util';
import { getEventIdsFromETags } from 'core/nostr/util';
import { CallRelayType } from 'core/worker/type';

import dynamic from 'next/dynamic';
import PostItems from 'components/PostItems';
import Segmented from 'components/shared/ui/Segmented';

const SubPostUI = dynamic(
  async () => {
    const mod = await import('components/PostItems/PostItem/sub');
    return mod.SubPostUI;
  },
  { loading: () => <p>Loading sub post ...</p>, ssr: false, suspense: true },
);

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
    <div className={className}>
      <div className="flex flex-col px-4 py-5 gap-5">
        <div className="flex justify-between w-full align-middle items-center">
          <div className="text-neutral-900 font-bold text-[16px] font-poppins leading-24">
            Replies{`(${commentList.length})`}
          </div>
          <div>
            <Segmented
              options={['recent', 'hot', 'zapest']}
              onChange={val => setCommentOrder(val as string)}
              value={commentOrder}
            />
          </div>
        </div>
        <ReplyEventInput
          worker={worker!}
          replyTo={rootEvent}
          successCb={successCb}
        />
      </div>

      {/** todo: fix the following hack */}
      <PostItems
        msgList={newPubReplyEvent}
        worker={worker!}
        showLastReplyToEvent={false}
      />

      {commentOrder === 'recent' &&
        threadTreeNodes.map(n => (
          <div key={n.value.id}>
            <PostItems
              msgList={[{ ...n.value, ...{ seen: [''] } }]}
              worker={worker!}
              showLastReplyToEvent={false}
            />
            {n.children.length > 0 && (
              <>
                <div className="pl-16">
                  {n.children.map(c => (
                    <SubPostUI
                      key={c.value.id}
                      eventId={c.value.id}
                      worker={worker}
                    />
                  ))}
                </div>
                <br />
                <br />
              </>
            )}
          </div>
        ))}

      {commentOrder !== 'recent' && (
        <div className="font-bold mt-2 px-2 py-1">
          Feature Under Construction 🚧
        </div>
      )}
    </div>
  );
};

export default Comments;
