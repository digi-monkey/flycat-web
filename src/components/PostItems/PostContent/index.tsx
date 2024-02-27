import { EventTags } from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { useMemo, useState } from 'react';
import { CallWorker } from 'core/worker/caller';
import { isNsfwEvent } from 'utils/validator';
import { renderContent } from './content';
import { doTextTransformer } from 'hooks/useTransformText';
import { useRouter } from 'next/router';
import { Paths } from 'constants/path';
import { TEXT_NOTE_MAX_WORD_LIMIT } from 'constants/common';
import { DecodedNeventResult, Nip19, Nip19DataType } from 'core/nip/19';

import styles from './index.module.scss';
import dynamic from 'next/dynamic';
import { Button } from 'components/shared/ui/Button';

const SubPostItem = dynamic(
  async () => {
    const mod = await import('../PostItem/sub');
    return mod.SubPostUI;
  },
  { loading: () => <p>Loading sub post ...</p>, ssr: false, suspense: true },
);

interface PostContentProp {
  ownerEvent: Event;
  worker?: CallWorker;
  showLastReplyToEvent?: boolean;
  truncate?: boolean;
}

export const PostContent: React.FC<PostContentProp> = ({
  ownerEvent: msgEvent,
  worker,
  showLastReplyToEvent = true,
  truncate = true,
}) => {
  const router = useRouter();

  const [expanded, setExpanded] = useState(!truncate);

  const lastReplyToEventId = useMemo(() => {
    const lastReply = msgEvent.tags
      .filter(t => t[0] === EventTags.E)
      .map(t => {
        return { id: t[1], relay: t[2]?.split(',')[0] };
      })
      .pop();
    return lastReply?.id;
  }, [msgEvent]);

  const elements = useMemo(
    () => doTextTransformer(msgEvent.id, msgEvent.content, msgEvent.tags),
    [msgEvent],
  );

  const isSubPostDuplicateWithEmbedNote = useMemo(() => {
    return elements.find(e => {
      if (e.type === 'mention') {
        const content = e.content;
        if (content.startsWith('nostr:nevent1')) {
          try {
            const data = content.split(':')[1];
            const res = Nip19.decodeShareable(data).data as DecodedNeventResult;
            return res.id === lastReplyToEventId;
          } catch (error) {}
        }

        if (content.startsWith('nostr:note1')) {
          try {
            const data = content.split(':')[1];
            const res = Nip19.decode(data);
            if (res.type === Nip19DataType.EventId) {
              return res.data === lastReplyToEventId;
            }
          } catch (error) {}
        }
      }
      return false;
    });
  }, [lastReplyToEventId, elements]);

  const content = useMemo(() => {
    return renderContent(
      elements,
      isNsfwEvent(msgEvent),
      expanded ? 0 : TEXT_NOTE_MAX_WORD_LIMIT,
    );
  }, [msgEvent, elements, expanded]);

  const isOverflow = useMemo(
    () => msgEvent.content.length > TEXT_NOTE_MAX_WORD_LIMIT,
    [msgEvent.content],
  );

  const contentStyle = { cursor: 'pointer' };

  const onContentClick = e => {
    e.stopPropagation();
    router.push(Paths.event + '/' + msgEvent.id);
  };

  const toggleExpanded = e => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <>
      <div onClick={onContentClick} style={contentStyle}>
        {content}
        {truncate && isOverflow && (
          <div>
            <Button
              className={styles.viewMore}
              variant="link"
              onClick={toggleExpanded}
            >
              {expanded ? 'View Less' : 'View More'}
            </Button>
          </div>
        )}
      </div>
      {showLastReplyToEvent &&
        lastReplyToEventId &&
        !isSubPostDuplicateWithEmbedNote && (
          <SubPostItem eventId={lastReplyToEventId} worker={worker} />
        )}
    </>
  );
};
