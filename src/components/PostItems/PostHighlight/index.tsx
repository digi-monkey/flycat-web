import { Event } from 'core/nostr/Event';

import styles from './index.module.scss';
import { EventTags } from 'core/nostr/type';
import { isValidHttpUrl } from 'utils/validator';
import { UrlPreview } from '../PostContent/URLPreview';

export interface PostHighlightProps {
  event: Event;
}

export const PostHighlight: React.FC<PostHighlightProps> = ({ event }) => {
  const link = event.tags.filter(t => t[0] === EventTags.R && isValidHttpUrl(t[1])).map(t => t[1])[1];
  return (
    <div>
      <div className={styles.quote}>{event.content}</div>
      <div>{link && <UrlPreview url={link}/>}</div>
    </div>
  );
};
