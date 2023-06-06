import { Avatar } from "antd";
import styles from "./index.module.scss";
import classNames from "classnames";
import Link from "next/link";
import { Paths } from "constants/path";
import { useTimeSince } from "hooks/useTimeSince";

interface PostUserProps {
  publicKey: string;
  avatar: string;
  name: string | React.ReactNode;
  descNodes?: React.ReactNode;
  rightNodes?: React.ReactNode;
  child?: boolean;
  time?: number;
}

const PostUser: React.FC<PostUserProps> = ({ publicKey, avatar, name, time, descNodes, rightNodes, child = false }) => {
  const timeSince = useTimeSince(time || 0);
  return <div className={classNames(styles.postUser, {
    [styles.child]: child
  })}>
    <div className={styles.user}>
      <Avatar src={avatar} alt="picture" />
      <div className={styles.info}>
        { typeof name === "string" ? <Link href={`${Paths.user + publicKey}`}>{name}</Link> : name }
        { !child && (
            <p>
              {descNodes}
              { time && <time>{timeSince}</time> }
            </p>
          )
        }
      </div>
    </div>
    { rightNodes && <div className={styles.slot}>{rightNodes}</div> }
  </div>
}

export default PostUser;
