import { Nip23 } from 'service/nip/23';
import { Nip9802 } from 'service/nip/9802';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import { EventWithSeen } from 'pages/type';

import Icon from 'components/Icon';
import styles from "./index.module.scss";
import PostUser from "./PostUser";
import PostReactions from './PostReactions';
import PostArticle from './PostArticle';

enum PostType {
  Link = "link",
  Article = "article",
  Highlight = "highlight",
  Reposted = "reposted",
}

interface PostItemsProps {
  msgList: EventWithSeen[], 
  worker: CallWorker, 
  userMap: UserMap, 
  relays: string[],
}

const PostItems: React.FC<PostItemsProps> = ({ msgList, worker, userMap, relays }) => {
  const getUser = (msg: EventWithSeen) => userMap.get(msg.pubkey);

  return <>
    { msgList.map((msg, index) => (
        <div className={styles.post} key={index}>
          <PostUser 
            publicKey={msg.pubkey}
            avatar={getUser(msg)?.picture || ''}
            name={getUser(msg)?.name}
            time={msg.created_at}
            rightNodes={<Icon type='icon-more-vertical' className={styles.more} />}
          />
          <div className={styles.content}>
            {
              Nip23.isBlogPost(msg) ? <PostArticle userAvatar={getUser(msg)?.picture || ''} userName={getUser(msg)?.name || ''} event={msg} /> : 
              Nip23.isBlogCommentMsg(msg) ? <>长文的评论</> : 
              Nip9802.isBlogHighlightMsg(msg) ? <>HighlightMsg</> : <>其他消息体</>
            }
            <PostReactions />
          </div>
        </div> 
      ))
    }
  </>;
}

export default PostItems;
