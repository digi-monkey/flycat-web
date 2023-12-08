import { EventTags } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { useTranslation } from 'next-i18next';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'antd';
import { CallWorker } from 'core/worker/caller';
import { isNsfwEvent } from 'utils/validator';
import { renderContent } from './content';
import { doTextTransformer } from 'hooks/useTransformText';

import styles from './index.module.scss';
import dynamic from 'next/dynamic';

const SubPostItem = dynamic(
  async () => {
    const mod = await import('./subPostItem');
    return mod.SubPostItem;
  },
  { loading: () => <p>Loading sub post ...</p>, ssr: false, suspense: true },
);

interface PostContentProp {
  ownerEvent: Event;
  worker?: CallWorker;
  showLastReplyToEvent?: boolean;
}

export const PostContent: React.FC<PostContentProp> = ({
  ownerEvent: msgEvent,
  worker,
  showLastReplyToEvent = true,
}) => {
  const { t } = useTranslation();

  const lastReplyToEventId = useMemo(() => {
    const lastReply = msgEvent.tags
      .filter(t => t[0] === EventTags.E)
      .map(t => {
        return { id: t[1], relay: t[2]?.split(',')[0] };
      })
      .pop();
    return lastReply?.id;
  }, [msgEvent.id]);

  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState<any[]>([]);

  const contentRef = useRef<HTMLDivElement>(null);

  const isOverflow =
    contentRef.current &&
    contentRef.current.scrollHeight > contentRef.current.clientHeight;

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  useEffect(() => {
    const elements = doTextTransformer(msgEvent.id, msgEvent.content, []);
    setContent(renderContent(elements, isNsfwEvent(msgEvent)));
  }, []);

  return (
    <div>
      {expanded ? (
        content
      ) : (
        <div>
          <div
            ref={contentRef}
            style={{ maxHeight: '100px', overflow: 'hidden' }}
          >
            {content}
          </div>
          {isOverflow && (
            <Button
              className={styles.viewMore}
              type="link"
              onClick={toggleExpanded}
            >
              {' '}
              View More
            </Button>
          )}
        </div>
      )}

      {showLastReplyToEvent && lastReplyToEventId && (
        <SubPostItem eventId={lastReplyToEventId} worker={worker} />
      )}
    </div>
  );
};
