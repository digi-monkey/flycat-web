import { Paths } from 'constants/path';
import { Nip19 } from 'core/nip/19';
import { connect } from 'react-redux';
import { useRouter } from 'next/router';
import { useCallWorker } from 'hooks/useWorker';
import { useTranslation } from 'next-i18next';
import { useEffect, useRef, useState } from 'react';
import { LoginMode, SignEvent } from 'store/loginReducer';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { Button, Mentions, Popover, Select, Tooltip } from 'antd';
import { handleFileSelect, handleSubmitText } from './util';
import {
  IMentions,
  useLoadCommunities,
  useLoadContacts,
  useSetMentions,
} from './hooks';

import Link from 'next/link';
import Icon from 'components/Icon';
import React from 'react';
import styles from './index.module.scss';
import Picker from '@emoji-mart/react';
import emojiData from '@emoji-mart/data';
import classNames from 'classnames';
import { Naddr } from 'core/nostr/type';
import { maxStrings } from 'utils/common';

interface Props {
  isLoggedIn: boolean;
  mode: LoginMode;
  signEvent?: SignEvent;
  pubSuccessCallback?: (eventId: string, relayUrl: string[]) => any;
  activeCommunity?: Naddr;
}

export const SubmitButton = ({ disabled }: { disabled: boolean }) => {
  const { t } = useTranslation();
  return (
    <Button disabled={disabled} type="primary" htmlType="submit">
      {t('pubNoteTextarea.btn.post')}
    </Button>
  );
};

const PubNoteTextarea: React.FC<Props> = ({
  isLoggedIn,
  signEvent,
  pubSuccessCallback,
  activeCommunity,
}) => {
  const router = useRouter();
  const myPublicKey = useReadonlyMyPublicKey();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();
  const { worker, newConn } = useCallWorker();
  const [text, setText] = useState('');
  const [attachImgs, setAttachImgs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [mentionValue, setMentionsValue] = useState<IMentions[]>([]);
  const [selectMention, setSelectMention] = useState({});
  const [mentionsFocus, setMentionsFocus] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Naddr>();

  const { userMap } = useLoadContacts({ worker, newConn });
  const communities = useLoadCommunities({ worker, newConn });
  useSetMentions(setMentionsValue, userMap);

  useEffect(()=>{
    if(activeCommunity){
      setSelectedCommunity(activeCommunity);
    }
  }, [activeCommunity])

  return (
    <div
      className={classNames(styles.pubNoteTextarea, {
        [styles.focus]: mentionsFocus,
      })}
    >
      <form
        onSubmit={event =>
          handleSubmitText(
            event,
            text,
            attachImgs,
            setText,
            setAttachImgs,
            selectMention,
            signEvent,
            myPublicKey,
            worker,
            pubSuccessCallback,
            selectedCommunity
          )
        }
      >
        <Mentions
          rows={3}
          placeholder={t('pubNoteBox.hintText') || ''}
          className={styles.postTextArea}
          value={text}
          onChange={value => setText(value)}
          onSelect={({ key, value }) =>
            setSelectMention({
              [value || '']: Nip19.encodeNprofile({
                pubkey: key ?? '',
                relays: [], // todo: add user's relay
              }),
              ...selectMention,
            })
          }
          options={mentionValue}
          onFocus={() => setMentionsFocus(true)}
          // onBlur={() => setMentionsFocus(false)}
        />
        {attachImgs.length > 0 && (
          <div className={styles.imgs}>
            {attachImgs.map((url, key) => (
              <div className={styles.imgItem} key={key}>
                <img src={url} key={key} alt="img" />
                <Icon
                  type="icon-cross"
                  onClick={() =>
                    setAttachImgs(
                      attachImgs.filter((_, index) => index !== key),
                    )
                  }
                />
              </div>
            ))}
          </div>
        )}
        <div
          className={classNames(styles.btn, {
            [styles.focus]: mentionsFocus,
          })}
        >
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
              content={
                <Picker
                  data={emojiData}
                  onEmojiSelect={res => setText(text + res.native)}
                  locale={router.locale}
                />
              }
            >
              <Tooltip placement="top" title={t('pubNoteTextarea.icons.emoji')}>
                <Icon type="icon-emoji" className={styles.emoji} />
              </Tooltip>
            </Popover>
            <Tooltip
              placement="top"
              title={t('pubNoteTextarea.icons.longForm')}
            >
              <Link href={Paths.write} passHref>
                <Icon type="icon-article" className={styles.article} />
              </Link>
            </Tooltip>
            <Popover
              title="Select community to post"
              content={
               <>
                <Select
                  title="community"
                  style={{ width: '200px' }}
                  value={selectedCommunity}
                  onChange={(value)=>setSelectedCommunity(value)}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').includes(input)
                  }
                  options={Array.from(communities.keys()).map(k => {
                    return {
                      label: communities.get(k)?.id,
                      value: k,
                    };
                  })}
                />
               </>
              }
            >
              <Icon type="icon-explore" className={styles.community} />
              {selectedCommunity ? maxStrings(communities.get(selectedCommunity)?.id||"", 10) : "No Comm"}
            </Popover>
          </div>
          <SubmitButton
            disabled={
              (text.length === 0 && attachImgs.length === 0) ||
              isUploading ||
              !isLoggedIn ||
              (isLoggedIn && signEvent == null)
            }
          />
        </div>
      </form>
    </div>
  );
};

const mapStateToProps = state => ({
  isLoggedIn: state.loginReducer.isLoggedIn,
  mode: state.loginReducer.mode,
  signEvent: state.loginReducer.signEvent,
  publicKey: state.loginReducer.publicKey,
  privateKey: state.loginReducer.privateKey,
});
export default connect(mapStateToProps)(PubNoteTextarea);
