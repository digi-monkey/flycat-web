import { Avatar, Button, Input, Popover, Tooltip } from 'antd';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { UserMap } from 'core/nostr/type';
import { connect, useSelector } from 'react-redux';
import { RootState } from 'store/configureStore';
import {
  WellKnownEventKind,
  EventTags,
  EventETag,
  EventPTag,
} from 'core/nostr/type';
import { RawEvent } from 'core/nostr/RawEvent';
import { EventWithSeen } from 'pages/type';
import { CallWorker } from 'core/worker/caller';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { handleFileSelect } from 'components/PubNoteTextarea/util';
import { useRouter } from 'next/router';
import { noticePubEventResult } from 'components/PubEventNotice';

import classNames from 'classnames';
import styles from './index.module.scss';
import Icon from 'components/Icon';
import emojiData from '@emoji-mart/data';
import Picker from '@emoji-mart/react';


export interface ReplyEventInputProp {
  userMap: UserMap;
  replyTo: EventWithSeen;
  worker: CallWorker;

  isLoggedIn: boolean;
}
export const ReplyEventInput: React.FC<ReplyEventInputProp> = ({
  worker,
  userMap,
  replyTo,
  isLoggedIn,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const myPublicKey = useReadonlyMyPublicKey();
  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = useState<string>('');
  const [attachImgs, setAttachImgs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isInputFocus, setIsInputFocus] = useState<boolean>(false);

  const submitComment = async () => {
    if (signEvent == null) return;
    if (inputText == null || inputText.length === 0) return;
    if (!worker) return;

    let text = inputText;

    for (const url of attachImgs) {
      text += `\n${url}`;
    }

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
      text,
    );

    const event = await signEvent(rawEvent);
    const handler = worker.pubEvent(event);
    noticePubEventResult(handler); 
    setInputText('');
  };

  const SubmitButton = ({ disabled }: { disabled: boolean }) => {
    const { t } = useTranslation();
    return (
      <Button disabled={disabled} type="primary" onClick={submitComment}>
        Reply
      </Button>
    );
  };

  return (
    <div className={styles.replyBox}>
      <div className={styles.replyInput}>
        <div>
          <Avatar
            size={'large'}
            src={userMap.get(myPublicKey)?.picture}
            alt="picture"
          />
        </div>
        <Input
          type="text"
          value={inputText}
          className={styles.input}
          onChange={e => setInputText(e.target.value)}
          placeholder="write your comment"
          onFocus={() => setIsInputFocus(true)}
        />
      </div>
      {attachImgs.length > 0 && (
        <div className={styles.imgs}>
          {attachImgs.map((url, key) => (
            <div className={styles.imgItem} key={key}>
              <img src={url} key={key} alt="img" />
              <Icon
                type="icon-cross"
                onClick={() =>
                  setAttachImgs(attachImgs.filter((_, index) => index !== key))
                }
              />
            </div>
          ))}
        </div>
      )}
      <div
        className={classNames(styles.btn, {
          [styles.focus]: isInputFocus,
        })}
      >
        <div className={styles.container}>
          <div className={styles.icons}>
            <Tooltip placement="top" title={t('pubNoteTextarea.icons.image')}>
              <Icon
                type="icon-image"
                onClick={() =>
                  fileInputRef.current && fileInputRef.current.click()
                }
                className={styles.upload}
              />
            </Tooltip>
            <input
              type="file"
              ref={fileInputRef}
              onChange={event =>
                handleFileSelect(event, setIsUploading, setAttachImgs)
              }
            />
            <Popover
              placement="bottom"
              title={inputText}
              content={
                <Picker
                  data={emojiData}
                  onEmojiSelect={res => setInputText(inputText + res.native)}
                  locale={router.locale}
                />
              }
            >
              <Tooltip placement="top" title={t('pubNoteTextarea.icons.emoji')}>
                <Icon type="icon-emoji" className={styles.emoji} />
              </Tooltip>
            </Popover>
          </div>
          <SubmitButton
            disabled={
              inputText?.length === 0 ||
              isUploading ||
              !isLoggedIn ||
              (isLoggedIn && signEvent == null)
            }
          />
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  isLoggedIn: state.loginReducer.isLoggedIn,
});

export default connect(mapStateToProps)(ReplyEventInput);
