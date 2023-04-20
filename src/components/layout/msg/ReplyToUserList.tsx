import Link from 'next/link';
import { Paths } from 'constants/path';
import { useTranslation } from 'next-i18next';
import { shortPublicKey } from 'service/helper';
import { useEffect, useState } from 'react';

const styles = {
  userName: {
    textDecoration: 'underline',
    marginRight: '5px',
  },
};
export interface ReactToUser {
  name?: string;
  pk: string;
}

export enum ReactToUserType {
  reply = "reply",
  highlight = "highlight",
  mention = "mention",
  quote = "quote",
}

export interface ReactToUserListProps {
  reactTo: ReactToUser[];
  reactType?: ReactToUserType;
}

export const ReactToUserList = ({ reactTo, reactType = ReactToUserType.reply }: ReactToUserListProps) => {
  const { t } = useTranslation();
  const [reactText, setReactText] = useState("");

  useEffect(()=>{
    switch (reactType) {
      case ReactToUserType.reply:
        setReactText(t('textMsg.replyTo')!);
        break;

      case ReactToUserType.highlight:
        setReactText(t('textMsg.highlight')!);
        break;

        case ReactToUserType.quote:
        setReactText(t('textMsg.quote')!);
        break;

        case ReactToUserType.mention:
        setReactText(t('textMsg.mention')!);
        break;
    
      default:
        setReactText("unknown reaction ");
        break;
    }
  }, [reactType]);
  return (
    <div style={{ marginBottom: '2px' }}>
      {reactTo.length > 0 && (
        <span style={{ color: 'gray', fontSize: '12px' }}>
          {reactText}{' '}
          {reactTo.map((r, i) => (
            <Link
              key={i}
              style={{
                ...styles.userName,
                ...{ color: 'gray', fontSize: '12px' },
              }}
              href={Paths.user + r.pk}
            >
              @{r.name || shortPublicKey(r.pk!)}
            </Link>
          ))}
        </span>
      )}
    </div>
  );
};
