import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EventId, Nostr } from 'service/api';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbUpRoundedIcon from '@mui/icons-material/ThumbUpRounded';
import { CallWorker } from 'service/worker/callWorker';

const styles = {
  smallBtn: {
    fontSize: '12px',
    marginLeft: '5px',
    border: 'none' as const,
    background: 'none',
    color: 'gray',
  },
};
export interface LikeProps {
  toEventId: EventId;
  toPublicKey: string;
  worker?: CallWorker;
  signPrivKey?: string;
  disabled?: boolean;
  count?: number;
}

export const Like = ({
  worker,
  toEventId,
  toPublicKey,
  signPrivKey,
  disabled,
  count = 0,
}: LikeProps) => {
  const { t } = useTranslation();
  const [totalCount, setTotalCount] = useState<number>(count);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const canLike = isLiked === false && disabled !== true;
  const submit = async () => {
    if (!canLike) {
      alert("can't not like again");
      return;
    }

    if (!signPrivKey || signPrivKey.length === 0) {
      alert('please sign in first!');
      return;
    }

    const event = await Nostr.newLikeEvent(toEventId, toPublicKey, signPrivKey);
    worker?.pubEvent(event);
    setIsLiked(true);
    setTotalCount(prev => prev + 1);
  };
  return (
    <button onClick={submit} style={styles.smallBtn} disabled={isLiked}>
      {canLike && (
        <span style={{ color: 'gray', fontSize: '14px' }}>
          <ThumbUpOutlinedIcon style={{ fontSize: '14px' }} />
          {totalCount > 0 && <span>{totalCount}</span>}
        </span>
      )}
      {!canLike && (
        <span style={{ color: 'rgb(141, 197, 63)', fontSize: '14px' }}>
          <ThumbUpRoundedIcon style={{ fontSize: '14px' }} />
          {totalCount > 0 && <span>{totalCount}</span>}
        </span>
      )}
    </button>
  );
};
