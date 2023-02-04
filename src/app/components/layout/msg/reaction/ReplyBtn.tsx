import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EventETag,
  EventId,
  EventPTag,
  EventTags,
  PrivateKey,
  PublicKey,
  RawEvent,
  WellKnownEventKind,
} from 'service/api';
import { matchKeyPair } from 'service/crypto';
import { CallWorker } from 'service/worker/callWorker';
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined';

const styles = {
  smallBtn: {
    fontSize: '12px',
    margin: '0 5px',
    border: 'none' as const,
  },
  input: {
    width: '100%',
    padding: '5px',
    minHeight: '48px',
    margin: '5px 0',
  },
};

interface KeyPair {
  publicKey: PublicKey;
  privateKey: PrivateKey;
}

function ReplyButton({
  replyToEventId,
  replyToPublicKey,
  myKeyPair,
  worker,
}: {
  replyToEventId: EventId;
  replyToPublicKey: PublicKey;
  myKeyPair?: KeyPair;
  worker: CallWorker;
}) {
  const { t } = useTranslation();
  const [showPopup, setShowPopup] = useState(false);

  const handleClick = () => {
    setShowPopup(!showPopup);
  };

  const handleSubmit = async (text: string) => {
    console.log(text, replyToEventId, replyToPublicKey);
    if (!myKeyPair) {
      alert('login first!');
      return;
    }

    if (myKeyPair.privateKey === '') {
      alert('set privateKey first!');
      return;
    }
    if (!matchKeyPair(myKeyPair.publicKey, myKeyPair.privateKey)) {
      alert('public key and private key not matched!');
      return;
    }

    const rawEvent = new RawEvent(
      myKeyPair.publicKey,
      WellKnownEventKind.text_note,
      [
        [EventTags.E, replyToEventId, ''] as EventETag,
        [EventTags.P, replyToPublicKey, ''] as EventPTag,
      ],
      text,
    );
    const event = await rawEvent.toEvent(myKeyPair.privateKey);
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
        <ReplyTextarea onSubmit={handleSubmit} disabled={!myKeyPair} />
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
