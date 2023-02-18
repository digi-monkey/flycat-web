import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EventId, Nostr } from 'service/api';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbUpRoundedIcon from '@mui/icons-material/ThumbUpRounded';
import { CallWorker } from 'service/worker/callWorker';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';

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
  disabled?: boolean;
  count?: number;
}

export const Like = ({
  worker,
  toEventId,
  toPublicKey,
  disabled,
  count = 0,
}: LikeProps) => {
  const { t } = useTranslation();
  const [totalCount, setTotalCount] = useState<number>(count);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const canLike = isLiked === false && disabled !== true;
  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );
  const submit = async () => {
    if (!canLike) {
      alert("can't not like again");
      return;
    }

    if (signEvent == null) {
      return alert('no sign method!');
    }

    const rawEvent = await Nostr.newLikeRawEvent(toEventId, toPublicKey);
    const event = await signEvent(rawEvent);
    worker?.pubEvent(event);
    setIsLiked(true);
    setTotalCount(prev => prev + 1);
  };
  return (
    /* disable for now
		onClick={submit}
	*/
    <button style={styles.smallBtn} disabled={isLiked}>
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
