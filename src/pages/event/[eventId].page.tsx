import { EventMap, UserMap } from 'core/nostr/type';
import { connect } from 'react-redux';
import { useRouter } from 'next/router';
import { useCallWorker } from 'hooks/useWorker';
import { EventWithSeen } from 'pages/type';
import { useTranslation } from 'next-i18next';
import { loginMapStateToProps } from 'pages/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { useState, useEffect } from 'react';
import { getEventIdsFromETags } from 'core/nostr/util';
import { PublicKey } from 'core/nostr/type';
import { Segmented } from 'antd';
import { TreeNode } from './tree';
import { SubPostItem } from 'components/PostItems/PostContent';
import CommentInput from './CommentInput';
import { _handleEvent } from './util';
import {
  useSubReplyEvents,
  useSubRootEvent,
  useSubUserMetadata,
} from './hooks';

import styles from './index.module.scss';
import PostItems from 'components/PostItems';

export const EventPage = () => {
  const { t } = useTranslation();
  const { eventId } = useRouter().query as { eventId: string };

  const myPublicKey = useReadonlyMyPublicKey();
  const { worker, newConn, wsConnectStatus } = useCallWorker();

  const [unknownPks, setUnknownPks] = useState<PublicKey[]>([]);
  const [commentList, setCommentList] = useState<EventWithSeen[]>([]);
  const [threadTreeNodes, setThreadTreeNodes] = useState<
    TreeNode<EventWithSeen>[]
  >([]);
  const [rootEvent, setRootEvent] = useState<EventWithSeen>();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [eventMap, setEventMap] = useState<EventMap>(new Map());

  const handleEvent = _handleEvent({
    userMap,
    setUserMap,
    setEventMap,
    eventId,
    rootEvent,
    setRootEvent,
    setCommentList,
    unknownPks,
    setUnknownPks,
  });

  useSubRootEvent({ newConn, eventId, worker, handleEvent });
  useSubReplyEvents({ newConn, eventId, commentList, worker, handleEvent });
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
          <div className={styles.pageTitle}>
            <div className={styles.title}>{t('thread.title')}</div>
          </div>

          <div>
            <div>
              {rootEvent && (
                <>
                  <PostItems
                    eventMap={eventMap}
                    msgList={[rootEvent]}
                    worker={worker!}
                    userMap={userMap}
                    relays={relayUrls}
                  />

                  <div className={styles.repliesHeader}>
                    <div className={styles.header}>
                      <div className={styles.title}>
                        Replies{`(${commentList.length})`}
                      </div>
                      <div>
                        <Segmented
                          className={styles.tab}
                          options={['recent', 'hot', 'zapest']}
                        />
                      </div>
                    </div>
                    <CommentInput
                      worker={worker!}
                      replyTo={rootEvent}
                      userMap={userMap}
                    />
                  </div>
                </>
              )}
            </div>

            {threadTreeNodes.map(n => (
              <div key={n.value.id}>
                <PostItems
                  msgList={[{ ...n.value, ...{ seen: [''] } }]}
                  worker={worker!}
                  userMap={userMap}
                  eventMap={eventMap}
                  relays={[]}
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
