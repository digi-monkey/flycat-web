import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EventETag,
  EventId,
  EventPTag,
  EventTags,
  PublicKey,
  RawEvent,
  WellKnownEventKind,
} from 'service/api';
import { CallWorker } from 'service/worker/callWorker';
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';

const styles = {
  smallBtn: {
    fontSize: '12px',
    margin: '0 5px',
    border: 'none' as const,
    background: 'none',
    color: 'gray',
  },
  input: {
    width: '100%',
    padding: '5px',
    minHeight: '48px',
    margin: '5px 0',
  },
};

function ReplyButton({
  replyToEventId,
  replyToPublicKey,
  worker,
}: {
  replyToEventId: EventId;
  replyToPublicKey: PublicKey;
  worker: CallWorker;
}) {
  const { t } = useTranslation();
  const [showPopup, setShowPopup] = useState(false);

  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );
  const myPublicKey = useReadonlyMyPublicKey();

  const handleClick = () => {
    setShowPopup(!showPopup);
  };

  const handleSubmit = async (text: string) => {
    console.log(text, replyToEventId, replyToPublicKey);

    if (signEvent == null) {
      throw new Error('no sign method!');
    }

    const rawEvent = new RawEvent(
      myPublicKey,
      WellKnownEventKind.text_note,
      [
        [EventTags.E, replyToEventId, ''] as EventETag,
        [EventTags.P, replyToPublicKey, ''] as EventPTag,
      ],
      text,
    );

    const event = await signEvent(rawEvent);
    console.log(text, event);

    // publish to all connected relays
    worker?.pubEvent(event);

    setShowPopup(false);
  };

  return (
    <>
      <button style={styles.smallBtn} onClick={handleClick}>
        <ModeCommentOutlinedIcon style={{ color: 'gray', fontSize: '14px' }} />{' '}
        {t('replyBtn.reply')}
      </button>
      {showPopup && (
        <ReplyTextarea onSubmit={handleSubmit} disabled={signEvent == null} />
      )}
    </>
  );
}

export interface ReplyTextareaProps {
  onSubmit: (text: string) => any;
  disabled: boolean;
}

export const ReplyTextarea = ({ onSubmit, disabled }: ReplyTextareaProps) => {
  const { t } = useTranslation();
  const [textareaValue, setTextareaValue] = useState('');
  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    onSubmit(textareaValue);

    // clear the textarea
    setTextareaValue('');
  };
  return (
    <form onSubmit={handleSubmit}>
      <label>
        <textarea
          style={styles.input}
          value={textareaValue}
          onChange={e => setTextareaValue(e.target.value)}
        />
      </label>
      <button style={styles.smallBtn} type="submit" disabled={disabled}>
        {t('replyBtn.submit')}
      </button>
    </form>
  );
};

export default ReplyButton;
