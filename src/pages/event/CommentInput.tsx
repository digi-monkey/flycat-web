import { Avatar, Button, Input } from 'antd';
import styles from './index.module.scss';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { UserMap } from 'core/nostr/type';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import { worker } from 'cluster';
import {
  WellKnownEventKind,
  EventTags,
  EventETag,
  EventPTag
} from 'core/nostr/type';
import { Event } from 'core/nostr/Event';
import { RawEvent } from 'core/nostr/RawEvent';
import { EventWithSeen } from 'pages/type';
import { CallWorker } from 'core/worker/caller';
import { useState } from 'react';

export interface CommentInputProp {
  userMap: UserMap;
  replyTo: EventWithSeen;
  worker: CallWorker;
}
export const CommentInput: React.FC<CommentInputProp> = ({
  worker,
  userMap,
  replyTo,
}) => {
  const myPublicKey = useReadonlyMyPublicKey();
  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );

  const [inputText, setInputText] = useState<string>();

  const submitComment = async () => {
    if (signEvent == null) return;
    if (inputText == null || inputText.length === 0) return;

    const relays = replyTo.seen;
    const relay = relays ? relays[0] : '';
    const tags = [
      [EventTags.E, replyTo.id, relay] as EventETag,
      [EventTags.P, replyTo.pubkey, relay] as EventPTag,
    ];
    const originTags = replyTo.tags;

    const rawEvent = new RawEvent(
      '',
      WellKnownEventKind.text_note,
      [...originTags, ...tags],
      inputText,
    );

    const event = await signEvent(rawEvent);
    worker?.pubEvent(event);
    alert('published!');
  };

  return (
    <div className={styles.replyInput}>
      <Avatar
        className={styles.img}
        src={userMap.get(myPublicKey)?.picture}
        alt="picture"
      />
      <Input
        type="text"
        value={inputText}
        onChange={e => setInputText(e.target.value)}
      />
      <Button onClick={submitComment}>submit</Button>
    </div>
  );
};
