import { Tooltip } from "antd";
import { useTranslation } from 'next-i18next';

import Icon from "components/Icon";
import styles from "./index.module.scss";

const PostReactions = () => {
  const { t } = useTranslation();
  return <ul className={styles.reactions}>
    <li>
      <Tooltip placement="top" title={t('pubNoteTextarea.icons.image')}>
        <Icon type='icon-repost' className={styles.upload} />
      </Tooltip>
    </li>
    <li>
      <Tooltip placement="top" title={t('pubNoteTextarea.icons.image')}>
        <Icon type='icon-bolt' className={styles.upload} />
      </Tooltip>
    </li>
    <li>
      <Tooltip placement="top" title={t('pubNoteTextarea.icons.image')}>
        <Icon type='icon-comment' className={styles.upload} />
      </Tooltip>
    </li>
    <li>
      <Tooltip placement="top" title={t('pubNoteTextarea.icons.image')}>
        <Icon type='icon-bookmark' className={styles.upload} />
        {/* icon-Bookmarked  */}
      </Tooltip>
    </li>
  </ul>;
}


// ReactionGroups = ({
//   msgEvent,
//   eventId,
//   worker,
//   pk,
//   seen,
//   relays,
//   lightingAddress,
// }: {
//   msgEvent: EventWithSeen;
//   worker: CallWorker;
//   pk: string;
//   eventId: string;
//   seen?: string[];
//   relays?: string[];
//   lightingAddress?: string;
// }) => {
  

//   const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

//   const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleClose = () => {
//     setAnchorEl(null);
//   };

//   const open = Boolean(anchorEl);

//   return (
//     <div style={{ marginTop: '15px' }}>
//       <span>
        
//         <span style={styles.reaction}>
//           {!isEmptyStr(lightingAddress) && (
//             <Tipping address={lightingAddress!} />
//           )}
//         </span>
//         <span
//           style={styles.reaction}
//           onClick={() => {
//             alert('working on it!');
//           }}
//         >
//           <Repost eventId={eventId} />
//         </span>
//         <span
//           style={styles.reaction}
//           onClick={() => {
//             alert('working on it!');
//           }}
//         >
//           <Bookmark eventId={eventId} />
//         </span>

//         <span style={styles.reaction}>
//           <ShowThread eventId={eventId} />
//         </span>
//         <span style={styles.reaction}>
//           <ReplyButton
//             replyToEventId={eventId}
//             replyToPublicKey={pk}
//             worker={worker}
//           />
//         </span>
//       </span>
//     </div>
//   );
// };

export default PostReactions
