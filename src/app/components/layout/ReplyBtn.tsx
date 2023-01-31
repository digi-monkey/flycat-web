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
import { CommentIcon } from './icon/Comment';

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
}: {
  replyToEventId: EventId;
  replyToPublicKey: PublicKey;
  myKeyPair?: KeyPair;
}) {
  const { t } = useTranslation();
  const [showPopup, setShowPopup] = useState(false);
  const [textareaValue, setTextareaValue] = useState('');
  const [worker, setWorker] = useState<CallWorker>();

  useEffect(() => {
    const worker = new CallWorker();
    setWorker(worker);
  }, []);

  const handleClick = () => {
    setShowPopup(!showPopup);
  };

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    console.log(textareaValue, replyToEventId, replyToPublicKey);

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
      textareaValue,
    );
    const event = await rawEvent.toEvent(myKeyPair.privateKey);
    console.log(textareaValue, event);

    // publish to all connected relays
    worker?.pubEvent(event);

    // clear the textarea
    setTextareaValue('');

    setShowPopup(false);
  };

  return (
    <>
      <button style={styles.smallBtn} onClick={handleClick}>
        <CommentIcon /> {t('replyBtn.reply')}
      </button>
      {showPopup && (
        <form onSubmit={handleSubmit}>
          <label>
            <textarea
              style={styles.input}
              value={textareaValue}
              onChange={e => setTextareaValue(e.target.value)}
            />
          </label>
          <button style={styles.smallBtn} type="submit" disabled={!myKeyPair}>
            {t('replyBtn.submit')}
          </button>
        </form>
      )}
    </>
  );
}

export default ReplyButton;
