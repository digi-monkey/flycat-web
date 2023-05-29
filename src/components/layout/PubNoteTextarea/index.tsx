import { Nip19 } from 'service/nip/19';
import { UserMap } from 'service/type';
import { useRouter } from 'next/router';
import { LoginMode } from 'store/loginReducer';
import { PublicKey } from 'service/api';
import { useTranslation } from 'next-i18next';
import { useRef, useState } from 'react';
import { Mentions, Popover } from 'antd';
import { IMentions, useSetMentions, useSetRelays } from './hooks';
import { handleFileSelect, handleSubmitText, makeInvoice } from './util';
import { SmileOutlined, SendOutlined, FileImageOutlined, ThunderboltOutlined } from '@ant-design/icons';

import React from 'react';
import styles from './index.module.scss';
import Picker from '@emoji-mart/react'
import emojiData from '@emoji-mart/data'
import classNames from 'classnames';

interface Props {
  disabled: boolean;
  mode: LoginMode;
  onSubmitText: (text: string) => Promise<any>;
  userContactList?: { keys: PublicKey[]; created_at: number };
  userMap: UserMap;
}

export const SubmitButton = ({ disabled }: { disabled: boolean }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <button
      style={{
        background: isHovered ? 'white' : '#8DC53F',
        color: isHovered ? 'black' : 'white',
        border: '1px solid #8DC53F',
        padding: '5px 10px',
        borderRadius: '5px',
      }}
      type="submit"
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SendOutlined />
    </button>
  );
}

export const PubNoteTextarea: React.FC<Props> = ({ disabled, mode, onSubmitText, userMap, userContactList }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSendLightingInvoiceEnabled = mode === LoginMode.nip07Wallet && typeof window.webln !== undefined;

  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [relays, setRelays] = useState<string[]>([]);
  const [attachImgs, setAttachImgs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [mentionValue, setMentionsValue] = useState<IMentions[]>([]);
  const [selectMention, setSelectMention] = useState({});
  const [mentionsFocus, setMentionsFocus] = useState(false);

  useSetMentions(setMentionsValue, userMap);
  useSetRelays(setRelays);

  return (
    <div className={classNames(styles.pubNoteTextarea, {
      [styles.focus]: mentionsFocus
    })}>
      <form onSubmit={event => handleSubmitText(event, text, attachImgs, setText, setAttachImgs, onSubmitText, selectMention)}>
        <Mentions
          rows={3}
          autoFocus
          placeholder={t('pubNoteBox.hintText') || ''}
          className={styles.postTextArea}
          value={text}
          onChange={value => setText(value)}
          onSelect={({pubkey, value}) => setSelectMention({ [value || '']: Nip19.encodeNprofile({pubkey: pubkey ?? '', relays}), ...selectMention })}
          options={mentionValue}
          onFocus={() => setMentionsFocus(true)}
          onBlur={() => setMentionsFocus(false)}
        />
        <div className={styles.btn}>
          <div className={styles.icons}>
            <div className={styles.imgs}>{ attachImgs.map((url, key) => <img src={url} key={key} alt="img" />) }</div>
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={isUploading}
              className={styles.iconBtn}
            >
              <FileImageOutlined />+{isUploading ? '↺' : ''}
            </button>
            <input type="file" ref={fileInputRef} onChange={event => handleFileSelect(event, setIsUploading, setAttachImgs)} />
            {isSendLightingInvoiceEnabled && (
              <button
                type="button"
                onClick={makeInvoice}
                disabled={!isSendLightingInvoiceEnabled}
                className={styles.iconBtn}
              >
                <ThunderboltOutlined />
              </button>
            )}
            <Popover placement="bottom" title={text} content={
              <Picker data={emojiData} onEmojiSelect={res => setText(text + res.native)} locale={router.locale} />
            }>
              <button type="button" className={styles.iconBtn}>
                <SmileOutlined />
              </button>
            </Popover>
          </div>
          <SubmitButton disabled={disabled} />
        </div>
      </form>
    </div>
  );
};
