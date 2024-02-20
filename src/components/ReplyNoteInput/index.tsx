import { Popover } from 'antd';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { EventSetMetadataContent } from 'core/nostr/type';
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
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { handleFileSelect } from 'components/PubNoteTextarea/util';
import { useRouter } from 'next/router';
import { noticePubEventResult } from 'components/PubEventNotice';

import Icon from 'components/Icon';
import Picker from '@emoji-mart/react';
import { Nip23 } from 'core/nip/23';
import { dexieDb } from 'core/db';
import { useToast } from 'components/shared/ui/Toast/use-toast';
import { Button } from 'components/shared/ui/Button';
import AvatarProfile from 'components/shared/ui/Avatar';
import { isValidPublicKey } from 'utils/validator';
import { Input } from 'components/shared/ui/Input';

export interface ReplyEventInputProp {
  replyTo: EventWithSeen;
  worker: CallWorker;
  successCb?: (eventId: string, relayUrl: string[]) => any;
  isLoggedIn: boolean;
}
export const ReplyEventInput: React.FC<ReplyEventInputProp> = ({
  worker,
  replyTo,
  successCb,
  isLoggedIn,
}) => {
  const router = useRouter();
  const { toast } = useToast();
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
  const [loadedUserProfile, setLoadedUserProfile] =
    useState<EventSetMetadataContent>();

  const loadUserProfile = async () => {
    if (!isValidPublicKey(myPublicKey)) return;

    // todo: set relay urls with correct one
    const profileEvent = await dexieDb.profileEvent.get(myPublicKey);
    if (profileEvent) {
      const metadata = JSON.parse(
        profileEvent.content,
      ) as EventSetMetadataContent;
      setLoadedUserProfile(metadata);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, [myPublicKey]);

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

    if (Nip23.isBlogPost(replyTo)) {
      const rawEvent = Nip23.commentToArticleEvent(inputText, replyTo);
      const event = await signEvent(rawEvent);
      const handler = worker.pubEvent(event);
      noticePubEventResult(toast, worker.relays.length, handler, successCb);
      setInputText('');
      return;
    }

    const tags = [
      [EventTags.E, replyTo.id, relay] as EventETag,
      [EventTags.P, replyTo.pubkey, relay] as EventPTag,
    ];
    const originTags = replyTo.tags.filter(
      t => t[0] === EventTags.E || t[0] === EventTags.P,
    ); // only copy the e and p tags.

    const rawEvent = new RawEvent(
      myPublicKey,
      WellKnownEventKind.text_note,
      [...originTags, ...tags],
      text,
    );

    const event = await signEvent(rawEvent);
    const handler = worker.pubEvent(event);
    noticePubEventResult(toast, worker.relays.length, handler, successCb);
    setInputText('');
  };

  const SubmitButton = ({ disabled }: { disabled: boolean }) => {
    const { t } = useTranslation();
    return (
      <Button disabled={disabled} onClick={submitComment}>
        Reply
      </Button>
    );
  };

  return (
    <div className="w-full">
      <div className="flex justify-stardt justify-center align-middle gap-6">
        <div>
          <AvatarProfile
            src={loadedUserProfile?.picture}
            alt="picture"
            fallback={loadUserProfile.name.slice(0, 2)}
          />
        </div>
        <Input
          inputMode="text"
          value={inputText}
          onChange={e => setInputText(e.currentTarget.value)}
          placeholder="write your comment"
          onFocus={() => setIsInputFocus(true)}
          size={'large'}
        />
      </div>
      {attachImgs.length > 0 && (
        <div className="pt-16 pl-0 mt-0">
          {attachImgs.map((url, key) => (
            <div
              className="inline-block mr-4 mb-4 align-bottom leading-0 relative"
              key={key}
            >
              <img
                className="text-xs w-10 h-10 border border-neutral-300 p-1 rounded-md"
                src={url}
                key={key}
                alt="img"
              />
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
        className={`transition-height duration-300 ease-in-out overflow-hidden ml-16 ${
          isInputFocus ? 'h-12' : 'h-0'
        }`}
      >
        <div className="mt-2 flex justify-between items-center h-full">
          <div>
            <Icon
              type="icon-image"
              onClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
              className="cursor-pointer w-[24px] h-[24px] mr-[20px] fill-primary-600 align-middle"
            />
            <input
              hidden
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
                  data={async () => {
                    const response = await fetch(
                      'https://cdn.jsdelivr.net/npm/@emoji-mart/data',
                    );

                    return response.json();
                  }}
                  onEmojiSelect={res => setInputText(inputText + res.native)}
                  locale={router.locale}
                />
              }
            >
              <Icon
                type="icon-emoji"
                className="w-[24px] h-[24px] mr-[20px] fill-primary-600 align-middle"
              />
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
